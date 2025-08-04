-- Create a temporary policy to allow reading mandants for testing purposes
CREATE POLICY "allow_read_mandants_for_testing" ON public.mandants
FOR SELECT 
USING (true);

-- Create a temporary policy to allow reading approved_bookings for testing purposes  
CREATE POLICY "allow_read_approved_bookings_for_testing" ON public.approved_bookings
FOR SELECT 
USING (true);