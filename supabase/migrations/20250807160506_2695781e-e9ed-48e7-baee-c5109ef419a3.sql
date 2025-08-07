-- Security Fixes Migration - Simplified and Fixed
-- Addresses critical security vulnerabilities step by step

-- 1. Ensure profiles table has role column with proper constraints
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer'));
  END IF;
  
  -- Ensure RLS is enabled on profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- 2. Create secure helper functions
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

-- 3. Create role escalation prevention function (fixed syntax)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow role changes by service role or existing admins
  IF (NEW.role != OLD.role) THEN
    -- Check if current user is admin via service role query
    IF auth.role() != 'service_role' AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
    
    -- Prevent self-promotion to admin (except by service role)
    IF NEW.role = 'admin' AND OLD.role != 'admin' AND auth.uid() = NEW.id AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Users cannot promote themselves to admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Add the trigger
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. Update new user function
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

-- 6. Ensure trigger exists for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Secure existing functions by fixing search paths
ALTER FUNCTION public.get_mandantenstammdaten() SET search_path = 'public';
ALTER FUNCTION public.search_tax_knowledge(text, integer) SET search_path = 'public';
ALTER FUNCTION public.import_agenda_mandants(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) SET search_path = 'public';