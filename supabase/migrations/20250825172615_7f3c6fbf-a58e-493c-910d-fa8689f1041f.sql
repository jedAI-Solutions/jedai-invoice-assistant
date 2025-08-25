-- Add constraint to profiles table to only allow 'admin' and 'user' roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'user'));