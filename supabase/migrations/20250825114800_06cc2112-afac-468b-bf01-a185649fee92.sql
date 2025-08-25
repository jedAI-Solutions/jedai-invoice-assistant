-- Security optimization: Remove duplicate functions and convert non-critical functions to SECURITY INVOKER
-- This will reduce the security definer attack surface while maintaining functionality

-- 1. Remove duplicate function (get_user_role is same as get_current_user_role)
DROP FUNCTION IF EXISTS public.get_user_role();

-- 2. Convert simple utility functions to SECURITY INVOKER (safer default)
-- These don't need elevated privileges as they only update the current row

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_document_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.document_id IS NULL THEN
    NEW.document_id := 'DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$$;

-- 3. Keep essential SECURITY DEFINER functions but add additional security checks
-- These need elevated privileges for cross-table access or security enforcement

-- Enhanced role checking with input validation
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
    AND p.id IS NOT NULL;  -- Additional safety check
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.role = 'admin', false) 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
    AND p.id IS NOT NULL;  -- Additional safety check
$$;

-- Enhanced mandant data access with stricter validation
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
      OR (
        auth.uid() IS NOT NULL  -- Additional safety check
        AND m.id IN (
          SELECT uma.mandant_id 
          FROM public.user_mandant_assignments uma 
          WHERE uma.user_id = auth.uid() 
            AND uma.is_active = true
        )
      )
    )
  ORDER BY m.name1;
$$;

-- Enhanced search function with rate limiting consideration
CREATE OR REPLACE FUNCTION public.search_tax_knowledge(search_query text, limit_results integer DEFAULT 10)
RETURNS TABLE(id bigint, title character varying, content text, category character varying, relevance_score numeric, ts_rank_score real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Input validation and security checks
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF search_query IS NULL OR LENGTH(TRIM(search_query)) < 2 THEN
        RAISE EXCEPTION 'Search query must be at least 2 characters';
    END IF;
    
    IF limit_results IS NULL OR limit_results < 1 OR limit_results > 50 THEN
        limit_results := 10;  -- Safe default
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

-- Comment explaining why remaining SECURITY DEFINER functions are necessary
COMMENT ON FUNCTION public.get_current_user_role() IS 'SECURITY DEFINER required: Needs to bypass RLS to check user roles for authorization decisions';
COMMENT ON FUNCTION public.is_admin() IS 'SECURITY DEFINER required: Needs to bypass RLS to check admin status for security policies';
COMMENT ON FUNCTION public.get_mandantenstammdaten() IS 'SECURITY DEFINER required: Needs elevated privileges to access mandant data across user boundaries';
COMMENT ON FUNCTION public.search_tax_knowledge(text, integer) IS 'SECURITY DEFINER required: Needs to access knowledge base with mandant-based filtering';
COMMENT ON FUNCTION public.create_audit_trail() IS 'SECURITY DEFINER required: Must be able to write audit logs regardless of user permissions';
COMMENT ON FUNCTION public.log_security_event(text, text) IS 'SECURITY DEFINER required: Security logging must work independently of user permissions';
COMMENT ON FUNCTION public.log_sensitive_data_access(text, text, uuid) IS 'SECURITY DEFINER required: Compliance logging must not be restricted by RLS';
COMMENT ON FUNCTION public.prevent_profile_role_escalation() IS 'SECURITY DEFINER required: Security enforcement must bypass user permissions';
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER required: User creation must bypass RLS to create initial profile';
COMMENT ON FUNCTION public.auto_assign_user_to_mandants() IS 'SECURITY DEFINER required: User assignment must work during registration';
COMMENT ON FUNCTION public.import_agenda_mandants(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) IS 'SECURITY DEFINER required: Import process needs elevated privileges for data migration';