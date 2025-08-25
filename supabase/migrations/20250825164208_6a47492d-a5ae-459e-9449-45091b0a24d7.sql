-- Update the handle_new_user function to send admin notifications
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_count INTEGER;
  notification_result JSONB;
BEGIN
  -- Check if there are any admin users
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- If this is the first user, make them an admin and activate them
  IF admin_count = 0 THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name, 
      last_name,
      role,
      is_active,
      status,
      approved_at
    )
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      'admin',  -- First user becomes admin
      TRUE,     -- First user is automatically active
      'approved',
      NOW()
    );
  ELSE
    -- Regular user creation (inactive by default)
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name, 
      last_name,
      is_active,
      status,
      pending_since
    )
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      FALSE,  -- New users are inactive by default
      'pending',
      NOW()
    );

    -- Send admin notification for new user registration
    BEGIN
      SELECT content INTO notification_result
      FROM http((
        'POST',
        current_setting('app.settings.supabase_url') || '/functions/v1/notify-admin-new-user',
        ARRAY[
          http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
          http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
          'userId', NEW.id,
          'email', NEW.email,
          'firstName', NEW.raw_user_meta_data->>'first_name',
          'lastName', NEW.raw_user_meta_data->>'last_name'
        )::text
      ));
      
      -- Log notification success
      PERFORM public.log_security_event(
        'ADMIN_NOTIFICATION_SENT', 
        'New user registration notification sent to admins for user: ' || NEW.email
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log notification failure but don't fail the user creation
      PERFORM public.log_security_event(
        'ADMIN_NOTIFICATION_FAILED', 
        'Failed to send admin notification for new user: ' || NEW.email || ' - Error: ' || SQLERRM
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;