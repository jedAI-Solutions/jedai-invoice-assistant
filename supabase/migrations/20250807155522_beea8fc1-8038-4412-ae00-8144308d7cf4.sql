-- Critical Security Fixes Migration
-- This migration addresses all major security vulnerabilities

-- 1. Create profiles table with proper structure and constraints
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure function to get current user role (prevents RLS recursion)
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

-- Create secure function to check if user is admin
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

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (except role)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (OLD.role = NEW.role OR public.is_admin())
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

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

-- Add trigger to prevent role escalation
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Create user profiles automatically on signup
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
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables that currently don't have it enabled
DO $$
DECLARE
  table_name TEXT;
  tables_to_secure TEXT[] := ARRAY[
    'tax_calculations',
    'tax_documents', 
    'tax_knowledge_base',
    'tax_responses',
    'tax_sessions',
    'user_preferences'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_secure
  LOOP
    -- Check if table exists before enabling RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- Secure tax_knowledge_base table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_knowledge_base') THEN
    -- Allow read access to authenticated users
    CREATE POLICY "Authenticated users can read tax knowledge"
      ON public.tax_knowledge_base FOR SELECT
      TO authenticated
      USING (true);
    
    -- Only admins can modify
    CREATE POLICY "Only admins can modify tax knowledge"
      ON public.tax_knowledge_base FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Secure user-specific tables (if they exist)
DO $$
DECLARE
  user_tables TEXT[] := ARRAY['tax_calculations', 'tax_documents', 'tax_responses', 'tax_sessions', 'user_preferences'];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY user_tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
      -- Check if table has user_id column
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = table_name AND column_name = 'user_id') THEN
        EXECUTE format('CREATE POLICY "%s_user_access" ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', table_name, table_name);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Update function search paths for security
UPDATE pg_proc SET proconfig = array_append(proconfig, 'search_path=public') 
WHERE proname IN ('get_mandantenstammdaten', 'search_tax_knowledge') 
AND proconfig IS NULL OR NOT 'search_path=public' = ANY(proconfig);

-- Create secure session management function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This would clean up any session-related data older than 24 hours
  -- Implementation depends on your session storage approach
  NULL;
END;
$$;

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
END;
$$;