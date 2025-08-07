-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'taxagent-documents', 
  'taxagent-documents', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can upload documents to their mandants"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'taxagent-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT m.mandant_nr 
    FROM mandants m
    JOIN user_mandant_assignments uma ON m.id = uma.mandant_id
    WHERE uma.user_id = auth.uid() AND uma.is_active = true
  )
);

CREATE POLICY "Users can view documents from their mandants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'taxagent-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT m.mandant_nr 
    FROM mandants m
    JOIN user_mandant_assignments uma ON m.id = uma.mandant_id
    WHERE uma.user_id = auth.uid() AND uma.is_active = true
  )
);

CREATE POLICY "Service role can access all documents"
ON storage.objects FOR ALL
USING (bucket_id = 'taxagent-documents' AND auth.role() = 'service_role');