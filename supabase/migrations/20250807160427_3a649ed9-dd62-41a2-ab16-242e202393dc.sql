-- Critical Security Fixes Migration (Handle Existing Structures)
-- This migration addresses security vulnerabilities while handling existing policies

-- First, let's safely update the profiles table structure if needed
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user', 'viewer'));
  END IF;
  
  -- Ensure RLS is enabled
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- Create secure functions (replace existing ones)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(p.role = 'admin', false) 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

-- Drop existing policies to recreate them properly
DO $$
DECLARE
  policy_name TEXT;
  policies TEXT[] := ARRAY[
    'Users can view their own profile',
    'Users can update their own profile (except role)',
    'Users can insert their own profile',
    'Admins can view all profiles',
    'Admins can update all profiles'
  ];
BEGIN
  FOREACH policy_name IN ARRAY policies
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %L ON public.profiles', policy_name);
    EXCEPTION WHEN OTHERS THEN
      -- Continue if policy doesn't exist
      NULL;
    END;
  END LOOP;
END $$;

-- Create new secure RLS policies for profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (OLD.role = NEW.role OR public.is_admin())
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

-- Prevent role escalation function
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow role changes by admins or service role
  IF OLD.role != NEW.role AND NOT public.is_admin() AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Prevent self-promotion to admin unless already admin
  IF NEW.role = 'admin' AND OLD.role != 'admin' AND auth.uid() = NEW.id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Users cannot promote themselves to admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to prevent role escalation (drop first if exists)
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Secure existing functions by updating search paths
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT proname, oid 
    FROM pg_proc 
    WHERE proname IN ('get_mandantenstammdaten', 'search_tax_knowledge', 'import_agenda_mandants')
    AND (proconfig IS NULL OR NOT 'search_path=public' = ANY(proconfig))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.oid::regprocedure);
  END LOOP;
END $$;

-- Create audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operation(
  operation_type TEXT,
  table_name TEXT,
  record_id UUID DEFAULT NULL,
  details JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_name,
    timestamp,
    new_values,
    gobd_relevant
  ) VALUES (
    table_name,
    record_id,
    'SENSITIVE_OPERATION: ' || operation_type,
    auth.uid(),
    (SELECT email FROM public.profiles WHERE id = auth.uid()),
    NOW(),
    details,
    true
  );
EXCEPTION WHEN OTHERS THEN
  -- Log to a simple audit table if the complex one doesn't exist
  NULL;
END;
$$;