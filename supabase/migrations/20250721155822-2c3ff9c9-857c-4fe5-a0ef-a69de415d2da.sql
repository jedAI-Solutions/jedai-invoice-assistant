-- Remove the problematic foreign key constraint from buchungshistorie to belege
-- The buchungshistorie table should not prevent deletion of belege entries

ALTER TABLE public.buchungshistorie 
DROP CONSTRAINT IF EXISTS buchungshistorie_beleg_id_fkey;

-- The beleg_id column in buchungshistorie should be nullable and not enforce referential integrity
-- This allows belege to be deleted independently of buchungshistorie entries
ALTER TABLE public.buchungshistorie 
ALTER COLUMN beleg_id DROP NOT NULL;