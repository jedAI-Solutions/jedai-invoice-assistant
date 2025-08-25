-- Fix the delete_user_account function to properly delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid, p_deleted_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Log the deletion attempt
  PERFORM public.log_security_event(
    'USER_ACCOUNT_DELETION', 
    'User ' || p_user_id::text || ' account deletion initiated by ' || p_deleted_by::text
  );

  -- Delete user-related data in correct order (respecting foreign keys)
  -- Delete from user_mandant_assignments
  DELETE FROM public.user_mandant_assignments WHERE user_id = p_user_id;
  
  -- Delete from user_roles if it exists
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  -- Delete audit logs for this user
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;
  
  -- Delete the profile first
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- CRITICAL: Delete from auth.users to prevent login
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Log successful deletion
  PERFORM public.log_security_event(
    'USER_ACCOUNT_DELETED', 
    'User ' || p_user_id::text || ' account successfully deleted by ' || p_deleted_by::text
  );
  
END;
$function$;