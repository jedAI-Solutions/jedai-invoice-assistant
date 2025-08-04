-- CRITICAL SECURITY FIXES (CORRECTED)
-- This migration addresses the most urgent security vulnerabilities

-- 1. Enable RLS on all unprotected tables
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for audit_log table
DROP POLICY IF EXISTS "Service role can access audit logs" ON public.audit_log;
CREATE POLICY "Service role can access audit logs" ON public.audit_log
FOR ALL USING (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Users can read their own audit logs" ON public.audit_log;
CREATE POLICY "Users can read their own audit logs" ON public.audit_log
FOR SELECT USING (user_id = auth.uid()::text);

-- 3. Fix function search paths (security issue)
-- Update existing functions to have proper search paths

-- Fix update_search_vector function
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$function$;

-- Fix get_mandantenstammdaten function
CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT m.name1::text, m.mandant_nr::text 
  FROM public.mandants m
  WHERE m.name1 IS NOT NULL 
  AND (
    auth.role() = 'service_role'::text 
    OR m.id IN (
      SELECT uma.mandant_id 
      FROM user_mandant_assignments uma 
      WHERE uma.user_id = auth.uid() 
      AND uma.is_active = true
    )
  )
  ORDER BY m.name1;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix search_tax_knowledge function
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        tkb.id,
        tkb.title,
        tkb.content,
        tkb.category,
        tkb.relevance_score,
        ts_rank(tkb.search_vector, plainto_tsquery('english', search_query)) as ts_rank_score
    FROM tax_knowledge_base tkb
    WHERE tkb.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank_score DESC, tkb.relevance_score DESC
    LIMIT limit_results;
END;
$function$;

-- Fix log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_session_id character varying, 
  p_user_id character varying, 
  p_action character varying, 
  p_details jsonb DEFAULT '{}'::jsonb, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO audit_log (session_id, user_id, action, details, ip_address, user_agent)
    VALUES (p_session_id, p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$function$;

-- Fix create_audit_trail function
CREATE OR REPLACE FUNCTION public.create_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix generate_document_id function
CREATE OR REPLACE FUNCTION public.generate_document_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.document_id IS NULL THEN
    NEW.document_id := 'DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create function to automatically assign users to mandants when they register
CREATE OR REPLACE FUNCTION public.auto_assign_user_to_mandants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create trigger to auto-assign users to mandants
DROP TRIGGER IF EXISTS on_user_created_assign_mandants ON auth.users;
CREATE TRIGGER on_user_created_assign_mandants
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_user_to_mandants();

-- 5. Fix mandant access policy
DROP POLICY IF EXISTS "mandant_access_policy" ON public.mandants;
CREATE POLICY "mandant_access_policy" ON public.mandants
FOR ALL USING (
  auth.role() = 'service_role'::text 
  OR id IN (
    SELECT uma.mandant_id 
    FROM user_mandant_assignments uma 
    WHERE uma.user_id = auth.uid() 
    AND uma.is_active = true
  )
);

-- 6. Create initial user assignment for existing users
INSERT INTO public.user_mandant_assignments (user_id, mandant_id, access_level)
SELECT 
  p.id,
  m.id,
  'read'
FROM public.profiles p
CROSS JOIN public.mandants m
WHERE m.status = 'active'
ON CONFLICT (user_id, mandant_id) DO NOTHING;