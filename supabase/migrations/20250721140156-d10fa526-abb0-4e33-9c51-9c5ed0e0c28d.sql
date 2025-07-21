-- Enable Row Level Security for belege table
ALTER TABLE public.belege ENABLE ROW LEVEL SECURITY;

-- Create policies for belege table
CREATE POLICY "Allow public to read belege entries" 
ON public.belege 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public to insert belege entries" 
ON public.belege 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to update belege entries" 
ON public.belege 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public to delete belege entries" 
ON public.belege 
FOR DELETE 
USING (true);