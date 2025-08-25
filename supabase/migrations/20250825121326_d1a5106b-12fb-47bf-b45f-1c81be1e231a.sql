-- Add admin approval system to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS pending_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the handle_new_user function to set new users as inactive by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;

-- Create function to approve users
CREATE OR REPLACE FUNCTION public.approve_user(
  p_user_id UUID,
  p_approved_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if approver is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_approved_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET 
    is_active = TRUE,
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW()
  WHERE id = p_user_id;

  -- Log the approval
  PERFORM public.log_security_event(
    'USER_APPROVED', 
    'User ' || p_user_id::text || ' approved by ' || p_approved_by::text
  );
END;
$$;

-- Create function to reject users
CREATE OR REPLACE FUNCTION public.reject_user(
  p_user_id UUID,
  p_rejected_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if rejector is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_rejected_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET 
    is_active = FALSE,
    status = 'rejected',
    approved_by = p_rejected_by,
    approved_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_user_id;

  -- Log the rejection
  PERFORM public.log_security_event(
    'USER_REJECTED', 
    'User ' || p_user_id::text || ' rejected by ' || p_rejected_by::text || 
    CASE WHEN p_reason IS NOT NULL THEN ' - Reason: ' || p_reason ELSE '' END
  );
END;
$$;

-- Update RLS policies to check is_active status
CREATE POLICY "Only active users can access system resources" 
ON public.profiles 
FOR ALL 
USING (
  auth.role() = 'service_role'::text OR 
  (auth.uid() = id AND is_active = TRUE) OR
  (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = TRUE))
);

-- Create admin view for user management
CREATE OR REPLACE VIEW public.admin_user_management AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.is_active,
  p.status,
  p.pending_since,
  p.approved_at,
  p.approved_by,
  p.rejection_reason,
  p.created_at,
  approver.email AS approved_by_email
FROM public.profiles p
LEFT JOIN public.profiles approver ON p.approved_by = approver.id
ORDER BY 
  CASE 
    WHEN p.status = 'pending' THEN 1
    WHEN p.status = 'approved' THEN 2
    WHEN p.status = 'rejected' THEN 3
  END,
  p.pending_since DESC;

-- Grant access to admin view
ALTER VIEW public.admin_user_management OWNER TO postgres;

-- Create RLS policy for admin user management view
CREATE POLICY "Only admins can view user management" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'service_role'::text OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = TRUE)
);