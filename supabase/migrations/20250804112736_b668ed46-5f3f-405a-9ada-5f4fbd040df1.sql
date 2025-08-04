-- Fix critical security issues and add missing RLS policies

-- 1. Fix the get_mandantenstammdaten function to respect RLS
DROP FUNCTION IF EXISTS public.get_mandantenstammdaten();

CREATE OR REPLACE FUNCTION public.get_mandantenstammdaten()
RETURNS TABLE(name1 text, mandant_nr text)
LANGUAGE sql
STABLE
AS $$
  SELECT m.name1::text, m.mandant_nr::text 
  FROM public.mandants m
  WHERE m.name1 IS NOT NULL 
  AND (
    auth.role() = 'service_role'::text 
    OR m.id IN (
      SELECT uma.mandant_id 
      FROM user_mandant_assignments uma 
      WHERE uma.user_id = auth.uid() 
      AND uma.is_active = true
    )
  )
  ORDER BY m.name1;
$$;

-- 2. Create user_mandant_assignments table for proper access control
CREATE TABLE IF NOT EXISTS public.user_mandant_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mandant_id uuid NOT NULL REFERENCES public.mandants(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  role text DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mandant_id)
);

-- Enable RLS on user_mandant_assignments
ALTER TABLE public.user_mandant_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for user_mandant_assignments
CREATE POLICY "Users can view their own assignments" 
ON public.user_mandant_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage assignments" 
ON public.user_mandant_assignments 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 3. Add missing RLS policies for unprotected tables

-- ai_feedback_loop policies
CREATE POLICY "ai_feedback_access_policy" 
ON public.ai_feedback_loop 
FOR ALL 
USING (
  auth.role() = 'service_role'::text 
  OR document_id IN (
    SELECT dr.id 
    FROM document_registry dr 
    WHERE dr.mandant_id IN (
      SELECT uma.mandant_id 
      FROM user_mandant_assignments uma 
      WHERE uma.user_id = auth.uid() 
      AND uma.is_active = true
    )
  )
);

-- data_processing_activities policies  
CREATE POLICY "data_processing_admin_policy" 
ON public.data_processing_activities 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "data_processing_read_policy" 
ON public.data_processing_activities 
FOR SELECT 
USING (is_active = true);

-- dtvf_import_history policies
CREATE POLICY "dtvf_import_admin_policy" 
ON public.dtvf_import_history 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 4. Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  first_name text,
  last_name text,
  role text DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 5. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Add updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_mandant_assignments_updated_at
  BEFORE UPDATE ON public.user_mandant_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();