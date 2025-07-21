-- Make mandant_id required for all belege entries
-- First, update any existing entries that might have NULL mandant_id
UPDATE public.belege 
SET mandant_id = 'm1' 
WHERE mandant_id IS NULL;

-- Add NOT NULL constraint to enforce mandant assignment
ALTER TABLE public.belege 
ALTER COLUMN mandant_id SET NOT NULL;

-- Add a check constraint to ensure mandant_id is not empty
ALTER TABLE public.belege 
ADD CONSTRAINT belege_mandant_id_not_empty 
CHECK (mandant_id IS NOT NULL AND mandant_id != '');

-- Create an index for better performance on mandant queries
CREATE INDEX IF NOT EXISTS idx_belege_mandant_id ON public.belege(mandant_id);