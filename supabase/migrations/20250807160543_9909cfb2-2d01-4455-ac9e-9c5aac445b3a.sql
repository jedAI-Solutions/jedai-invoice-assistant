-- Core Security Fixes - Final Migration
-- Only addresses existing security vulnerabilities

-- 1. Ensure profiles table security
DO $$
BEGIN
  -- Add role column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer'));
  END IF;
  
  -- Ensure RLS is enabled
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- 2. Create secure role checking functions
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

-- 3. Update existing RLS policies to use secure functions
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_policy"  
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Secure existing functions that exist
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT oid, proname
    FROM pg_proc 
    WHERE proname IN ('get_mandantenstammdaten', 'search_tax_knowledge')
    AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.oid::regprocedure);
  END LOOP;
END $$;

-- 5. Create basic audit function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  details TEXT DEFAULT ''
)
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Simple security event logging
  INSERT INTO public.audit_logs (
    entity_type,
    action,
    user_id,
    user_name,
    timestamp,
    gobd_relevant
  ) VALUES (
    'security_event',
    event_type || ': ' || details,
    auth.uid(),
    auth.jwt() ->> 'email',
    NOW(),
    true
  );
EXCEPTION WHEN OTHERS THEN
  -- Fail silently if audit table doesn't exist or has different structure
  NULL;
END;
$$;