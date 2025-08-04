-- Fix the processing_status constraint to include 'forwarded_to_workflow' and 'forwarding_failed'
-- which are used by the edge function

ALTER TABLE public.document_registry 
DROP CONSTRAINT IF EXISTS document_registry_processing_status_check;

-- Add the updated constraint with all the values the edge function uses
ALTER TABLE public.document_registry 
ADD CONSTRAINT document_registry_processing_status_check 
CHECK (processing_status = ANY (ARRAY[
  'received'::text, 
  'forwarded_to_workflow'::text, 
  'forwarding_failed'::text,
  'ocr_processing'::text, 
  'ai_classifying'::text, 
  'pending_approval'::text, 
  'approved'::text, 
  'rejected'::text, 
  'exported'::text, 
  'archived'::text
]));