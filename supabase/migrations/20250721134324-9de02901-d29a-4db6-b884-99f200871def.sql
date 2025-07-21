-- Create RLS policies for buchungshistorie table to allow inserts
CREATE POLICY "Allow public to insert buchungshistorie entries" 
ON public.buchungshistorie 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to read buchungshistorie entries" 
ON public.buchungshistorie 
FOR SELECT 
USING (true);