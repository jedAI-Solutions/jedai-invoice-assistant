-- Make jev.noskov@gmail.com an admin
UPDATE public.profiles 
SET 
  role = 'admin',
  status = 'approved',
  is_active = true,
  approved_at = NOW()
WHERE email = 'jev.noskov@gmail.com';

-- Log this admin promotion for audit purposes
DO $$
BEGIN
  PERFORM public.log_security_event(
    'ADMIN_PROMOTION', 
    'User jev.noskov@gmail.com promoted to admin role via manual update'
  );
END
$$;