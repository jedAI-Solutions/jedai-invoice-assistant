-- Complete the security optimization without the problematic comment
-- Add comments for remaining SECURITY DEFINER functions (with correct signatures)

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

-- Get the correct signature for import_agenda_mandants and add comment
DO $$
DECLARE
    func_signature text;
BEGIN
    SELECT pg_get_function_identity_arguments(p.oid) 
    INTO func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname = 'import_agenda_mandants';
    
    IF func_signature IS NOT NULL THEN
        EXECUTE format('COMMENT ON FUNCTION public.import_agenda_mandants(%s) IS %L', 
                      func_signature, 
                      'SECURITY DEFINER required: Import process needs elevated privileges for data migration');
    END IF;
END
$$;