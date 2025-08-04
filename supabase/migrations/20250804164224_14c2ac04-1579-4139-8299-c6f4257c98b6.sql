-- CRITICAL SECURITY FIXES

-- 1. Fix search_path for security definer functions to prevent injection attacks
CREATE OR REPLACE FUNCTION public.update_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_audit_trail()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO audit_logs (
    entity_type, 
    entity_id, 
    action, 
    old_values, 
    new_values,
    gobd_relevant,
    user_id,
    user_name
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    true,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'system')
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_assign_user_to_mandants()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Assign new users to all active mandants with read access
  INSERT INTO public.user_mandant_assignments (user_id, mandant_id, access_level)
  SELECT 
    NEW.id,
    m.id,
    'read'
  FROM public.mandants m
  WHERE m.status = 'active'
  ON CONFLICT (user_id, mandant_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_document_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.document_id IS NULL THEN
    NEW.document_id := 'DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Enable RLS on tables that currently have it disabled
-- Check each table and enable RLS if needed

-- Check if user_mandant_assignments table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_mandant_assignments' AND table_schema = 'public') THEN
    ALTER TABLE public.user_mandant_assignments ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for user_mandant_assignments if it doesn't exist
    DROP POLICY IF EXISTS user_assignment_access_policy ON public.user_mandant_assignments;
    CREATE POLICY user_assignment_access_policy ON public.user_mandant_assignments
    FOR ALL
    USING (
      auth.role() = 'service_role'::text 
      OR user_id = auth.uid()
    );
  END IF;
END $$;

-- 3. Create role-based access function for better security
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

-- 4. Add sensitive data access policy for mandants table
-- Create view with limited sensitive data exposure
DROP VIEW IF EXISTS public.mandant_public_view;
CREATE VIEW public.mandant_public_view AS
SELECT 
  id,
  mandant_nr,
  name1,
  name2,
  mandantentyp,
  strasse,
  plz,
  ort,
  land,
  telefon,
  rechtsform,
  kontenrahmen,
  versteuerung,
  status,
  created_at,
  updated_at
FROM public.mandants
WHERE status = 'active';

-- Create RLS policy for the view
ALTER VIEW public.mandant_public_view SET (security_barrier = true);

-- 5. Enhance audit logging with more security context
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_operation text,
  p_record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_name,
    ip_address,
    session_id,
    timestamp,
    gobd_relevant
  ) VALUES (
    p_table_name,
    p_record_id,
    'SENSITIVE_DATA_ACCESS: ' || p_operation,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'anonymous'),
    inet_client_addr(),
    COALESCE(auth.jwt() ->> 'session_id', 'unknown'),
    NOW(),
    true
  );
END;
$$;