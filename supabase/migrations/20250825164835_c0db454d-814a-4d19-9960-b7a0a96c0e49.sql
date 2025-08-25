-- Simplify the handle_new_user function - remove the HTTP call since we'll handle notifications from frontend
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_count INTEGER;
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
  END IF;
  
  RETURN NEW;
END;
$function$;