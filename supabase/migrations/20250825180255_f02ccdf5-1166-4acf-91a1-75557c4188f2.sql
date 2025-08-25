-- Strengthen delete_user_account: only allow deleting PENDING users, handle missing rows gracefully
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid, p_deleted_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  -- Check if the person making the deletion is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_deleted_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete user accounts';
  END IF;

  -- Prevent self-deletion
  IF p_user_id = p_deleted_by THEN
    RAISE EXCEPTION 'Admins cannot delete their own account';
  END IF;

  -- Check user exists and is pending
  SELECT status INTO v_status FROM public.profiles WHERE id = p_user_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending users can be deleted';
  END IF;

  -- Log the deletion attempt
  PERFORM public.log_security_event(
    'USER_ACCOUNT_DELETION', 
    'User ' || p_user_id::text || ' account deletion initiated by ' || p_deleted_by::text
  );

  -- Delete user-related data in correct order (respecting foreign keys)
  DELETE FROM public.user_mandant_assignments WHERE user_id = p_user_id;
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Note: Removing from auth.users must be done via Admin API (edge function)
  -- We intentionally do NOT touch auth.users here to avoid permission issues.

  -- Log successful deletion (application data)
  PERFORM public.log_security_event(
    'USER_ACCOUNT_DELETED_APP', 
    'Application data for user ' || p_user_id::text || ' deleted by ' || p_deleted_by::text
  );
END;
$function$