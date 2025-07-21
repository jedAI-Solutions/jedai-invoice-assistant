-- Add missing RLS policies for export_queue table to allow DELETE and UPDATE operations

CREATE POLICY "Allow public to delete export queue entries" 
ON public.export_queue 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public to update export queue entries" 
ON public.export_queue 
FOR UPDATE 
USING (true);