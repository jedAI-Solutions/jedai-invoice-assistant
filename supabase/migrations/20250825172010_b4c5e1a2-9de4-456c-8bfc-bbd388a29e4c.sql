-- Remove unused user role system components
-- Check for dependencies first, then remove unused table and enum

-- Drop the unused user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Drop functions that depend on the app_role enum
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Recreate get_current_user_role without app_role dependency
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(p.role, 'user') 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
$$;

-- Drop the unused app_role enum type
DROP TYPE IF EXISTS public.app_role;