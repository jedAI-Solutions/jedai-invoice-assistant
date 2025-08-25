-- Create function to change user role (admin only)
CREATE OR REPLACE FUNCTION public.change_user_role(p_user_id uuid, p_new_role text, p_changed_by uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the person making the change is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_changed_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  -- Validate new role
  IF p_new_role NOT IN ('admin', 'user', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, user, or viewer';
  END IF;

  -- Update user role
  UPDATE public.profiles 
  SET 
    role = p_new_role,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the role change
  PERFORM public.log_security_event(
    'USER_ROLE_CHANGED', 
    'User ' || p_user_id::text || ' role changed to ' || p_new_role || ' by ' || p_changed_by::text
  );
END;
$function$;

-- Create function to delete user and all related data (admin only)
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
  
  -- Delete the profile (this will cascade to auth.users due to foreign key)
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Note: The actual auth.users deletion will be handled by the cascade
  -- or by Supabase's auth system
END;
$function$;