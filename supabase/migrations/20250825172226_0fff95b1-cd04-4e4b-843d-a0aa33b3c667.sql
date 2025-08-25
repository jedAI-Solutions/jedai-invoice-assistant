-- Remove everything with CASCADE to handle all dependencies
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- Drop the unused user_roles table with CASCADE
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop the unused app_role enum type
DROP TYPE IF EXISTS public.app_role CASCADE;