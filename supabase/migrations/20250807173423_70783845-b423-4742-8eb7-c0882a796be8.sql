-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- RLS policies for documents bucket
CREATE POLICY "Users can view documents from their mandants" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.user_mandant_assignments uma
    WHERE uma.user_id = auth.uid()
    AND (storage.foldername(name))[1] = uma.mandant_id::text
  )
);

CREATE POLICY "Users can upload documents to their mandants" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.user_mandant_assignments uma
    WHERE uma.user_id = auth.uid()
    AND (storage.foldername(name))[1] = uma.mandant_id::text
  )
);

CREATE POLICY "Users can update documents from their mandants" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.user_mandant_assignments uma
    WHERE uma.user_id = auth.uid()
    AND (storage.foldername(name))[1] = uma.mandant_id::text
  )
);

CREATE POLICY "Users can delete documents from their mandants" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.user_mandant_assignments uma
    WHERE uma.user_id = auth.uid()
    AND (storage.foldername(name))[1] = uma.mandant_id::text
  )
);

-- Add document_url column to ai_classifications table to store the file path
ALTER TABLE public.ai_classifications 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.ai_classifications.document_url IS 'Storage path to the original document file in Supabase Storage';