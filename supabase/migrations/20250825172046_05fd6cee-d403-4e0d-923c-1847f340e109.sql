-- Now safely remove the unused user role system components
-- Drop functions that depend on the app_role enum
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Drop the unused user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Drop the unused app_role enum type
DROP TYPE IF EXISTS public.app_role;