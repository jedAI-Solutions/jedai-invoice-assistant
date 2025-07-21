-- Create RLS policies for export_queue table to allow inserts
CREATE POLICY "Allow public to insert export queue entries" 
ON public.export_queue 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to read export queue entries" 
ON public.export_queue 
FOR SELECT 
USING (true);

-- First, let's create a buchungshistorie entry for our test data, then we can reference it
-- We'll create a sample entry that matches our booking data
INSERT INTO public.buchungshistorie (
  buchung_id,
  buchungsdatum,
  betrag,
  konto,
  gegenkonto,
  buchungstext,
  name
) VALUES (
  gen_random_uuid(),
  CURRENT_DATE,
  0.00,
  '0000',
  '0000',
  'Sample booking for export queue',
  'Sample'
) ON CONFLICT DO NOTHING;