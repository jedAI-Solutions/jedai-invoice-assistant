-- Security Fix: Enable RLS on unprotected tables and create policies

-- Enable RLS on tax_calculations table
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_calculations
CREATE POLICY "tax_calculations_access_policy" ON public.tax_calculations
FOR ALL USING (
  auth.role() = 'service_role'::text OR
  mandant_id IN (
    SELECT uma.mandant_id 
    FROM user_mandant_assignments uma 
    WHERE uma.user_id = auth.uid() 
    AND uma.is_active = true
  )
);

-- Enable RLS on tax_documents table
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_documents
CREATE POLICY "tax_documents_access_policy" ON public.tax_documents
FOR ALL USING (
  auth.role() = 'service_role'::text OR
  mandant_id IN (
    SELECT uma.mandant_id 
    FROM user_mandant_assignments uma 
    WHERE uma.user_id = auth.uid() 
    AND uma.is_active = true
  )
);

-- Enable RLS on tax_knowledge_base table
ALTER TABLE public.tax_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_knowledge_base (public read for active records, admin write)
CREATE POLICY "tax_knowledge_base_read_policy" ON public.tax_knowledge_base
FOR SELECT USING (is_active = true);

CREATE POLICY "tax_knowledge_base_write_policy" ON public.tax_knowledge_base
FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "tax_knowledge_base_update_policy" ON public.tax_knowledge_base
FOR UPDATE USING (auth.role() = 'service_role'::text);

CREATE POLICY "tax_knowledge_base_delete_policy" ON public.tax_knowledge_base
FOR DELETE USING (auth.role() = 'service_role'::text);

-- Enable RLS on tax_responses table
ALTER TABLE public.tax_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_responses
CREATE POLICY "tax_responses_access_policy" ON public.tax_responses
FOR ALL USING (
  auth.role() = 'service_role'::text OR
  session_id IN (
    SELECT ts.id 
    FROM tax_sessions ts 
    WHERE ts.user_id = auth.uid()
  )
);

-- Enable RLS on tax_sessions table
ALTER TABLE public.tax_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_sessions
CREATE POLICY "tax_sessions_access_policy" ON public.tax_sessions
FOR ALL USING (
  auth.role() = 'service_role'::text OR
  user_id = auth.uid()
);

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "user_preferences_access_policy" ON public.user_preferences
FOR ALL USING (
  auth.role() = 'service_role'::text OR
  user_id = auth.uid()
);

-- Create secure view for mandant data that hides sensitive information
CREATE OR REPLACE VIEW public.mandants_secure AS
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
  ust_zeitraum,
  status,
  created_at,
  updated_at
FROM public.mandants
WHERE id IN (
  SELECT uma.mandant_id 
  FROM user_mandant_assignments uma 
  WHERE uma.user_id = auth.uid() 
  AND uma.is_active = true
);

-- Enable RLS on the secure view
ALTER VIEW public.mandants_secure SET (security_barrier = true);

-- Update existing security definer functions to be more secure
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$function$;

-- Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_table_name text,
  p_operation text,
  p_record_id uuid DEFAULT NULL
)
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
    timestamp,
    gobd_relevant
  ) VALUES (
    p_table_name,
    p_record_id,
    'SENSITIVE_ACCESS: ' || p_operation,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'anonymous'),
    inet_client_addr(),
    NOW(),
    true
  );
END;
$function$;

-- Create function to safely get mandant data with audit logging
CREATE OR REPLACE FUNCTION public.get_mandant_safe(p_mandant_id uuid)
RETURNS TABLE(
  id uuid,
  mandant_nr text,
  name1 text,
  name2 text,
  ort text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the access attempt
  PERFORM public.log_sensitive_access('mandants', 'READ', p_mandant_id);
  
  -- Return safe mandant data
  RETURN QUERY
  SELECT 
    m.id,
    m.mandant_nr,
    m.name1,
    m.name2,
    m.ort,
    m.status
  FROM public.mandants m
  WHERE m.id = p_mandant_id
  AND m.id IN (
    SELECT uma.mandant_id 
    FROM user_mandant_assignments uma 
    WHERE uma.user_id = auth.uid() 
    AND uma.is_active = true
  );
END;
$function$;