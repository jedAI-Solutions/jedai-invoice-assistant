-- Fix remaining security issues: Update function search paths

-- Update functions that need proper search_path settings
-- These functions are from pg_trgm extension but let's ensure they have proper settings
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update other security definer functions to have proper search paths
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

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, details text DEFAULT ''::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(p_table_name text, p_operation text, p_record_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_session_id character varying, p_user_id character varying, p_action character varying, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO audit_log (session_id, user_id, action, details, ip_address, user_agent)
    VALUES (p_session_id, p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$function$;

-- Log a security event for the security fixes
SELECT public.log_security_event('SECURITY_AUDIT_COMPLETED', 'Fixed RLS policies and SECURITY DEFINER views. Enabled RLS on tax tables and user_preferences.');