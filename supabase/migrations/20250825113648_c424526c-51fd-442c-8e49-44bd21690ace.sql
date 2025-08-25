-- Fix search_path for security definer functions to prevent potential security issues
-- This addresses both the security definer concerns and the search path mutable warnings

-- Update get_mandantenstammdaten to ensure proper security
CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.name1::text, m.mandant_nr::text 
  FROM public.mandants m
  WHERE m.name1 IS NOT NULL 
  AND m.status = 'active'
  AND (
    auth.role() = 'service_role'::text 
    OR m.id IN (
      SELECT uma.mandant_id 
      FROM public.user_mandant_assignments uma 
      WHERE uma.user_id = auth.uid() 
      AND uma.is_active = true
    )
  )
  ORDER BY m.name1;
$$;

-- Update search_tax_knowledge to fix search path and improve security
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow access if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    RETURN QUERY
    SELECT 
        tkb.id,
        tkb.title,
        tkb.content,
        tkb.category,
        tkb.relevance_score,
        ts_rank(tkb.search_vector, plainto_tsquery('english', search_query)) as ts_rank_score
    FROM public.tax_knowledge_base tkb
    WHERE tkb.search_vector @@ plainto_tsquery('english', search_query)
      AND tkb.is_active = true
      AND (
        tkb.mandant_specific = false 
        OR tkb.mandant_id IN (
          SELECT uma.mandant_id 
          FROM public.user_mandant_assignments uma 
          WHERE uma.user_id = auth.uid() 
          AND uma.is_active = true
        )
      )
    ORDER BY ts_rank_score DESC, tkb.relevance_score DESC
    LIMIT limit_results;
END;
$$;

-- Update other critical functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role = 'admin', false) 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

-- Update log_security_event to fix search path
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, details text DEFAULT ''::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update log_sensitive_data_access to fix search path
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(p_table_name text, p_operation text, p_record_id uuid DEFAULT NULL::uuid)
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