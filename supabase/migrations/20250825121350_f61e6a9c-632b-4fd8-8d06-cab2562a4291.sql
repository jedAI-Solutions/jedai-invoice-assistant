-- Fix security definer view issue by removing the problematic view and using proper RLS
DROP VIEW IF EXISTS public.admin_user_management;

-- Instead of a view, we'll use direct table queries with proper RLS policies
-- Remove the problematic RLS policy that was created
DROP POLICY IF EXISTS "Only admins can view user management" ON public.profiles;

-- Update the existing RLS policy to be more specific
DROP POLICY IF EXISTS "Only active users can access system resources" ON public.profiles;

-- Create proper RLS policies for profiles table
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Active users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND is_active = TRUE);

CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin' AND is_active = TRUE
  )
);

CREATE POLICY "Admins can update user statuses"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'admin' AND is_active = TRUE
  )
);

-- Allow service role full access
CREATE POLICY "Service role full access"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Update the user creation trigger to also create an admin user if none exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;