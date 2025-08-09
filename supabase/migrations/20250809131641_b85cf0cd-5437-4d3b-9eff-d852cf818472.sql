BEGIN;

-- 1) Remove overly permissive testing policies
DROP POLICY IF EXISTS "allow_read_mandants_for_testing" ON public.mandants;
DROP POLICY IF EXISTS "allow_read_approved_bookings_for_testing" ON public.approved_bookings;

-- 2) Harden dtvf_booking_lines access to user-assigned mandants via export batch -> mandant mapping
DROP POLICY IF EXISTS "dtvf_lines_access_policy" ON public.dtvf_booking_lines;

CREATE POLICY "dtvf_lines_access_policy"
ON public.dtvf_booking_lines
AS PERMISSIVE
FOR ALL
USING (
  auth.role() = 'service_role'
  OR export_batch_id IN (
    SELECT b.id
    FROM public.dtvf_export_batches b
    JOIN public.mandants m ON m.mandant_nr = b.client_number
    WHERE m.id IN (
      SELECT uma.mandant_id
      FROM public.user_mandant_assignments uma
      WHERE uma.user_id = auth.uid() AND uma.is_active = true
    )
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR export_batch_id IN (
    SELECT b.id
    FROM public.dtvf_export_batches b
    JOIN public.mandants m ON m.mandant_nr = b.client_number
    WHERE m.id IN (
      SELECT uma.mandant_id
      FROM public.user_mandant_assignments uma
      WHERE uma.user_id = auth.uid() AND uma.is_active = true
    )
  )
);

-- 3) Prevent profile role escalation by non-admins
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- Only admins may change roles
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Insufficient privileges to change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_escalation();

COMMIT;