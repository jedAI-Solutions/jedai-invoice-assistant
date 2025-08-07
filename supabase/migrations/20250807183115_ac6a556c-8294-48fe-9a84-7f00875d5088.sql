-- Create storage bucket for taxagent documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('taxagent-documents', 'taxagent-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- Create RLS policies for the taxagent-documents bucket
CREATE POLICY "Users can upload their own mandant documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'taxagent-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their own mandant documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'taxagent-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own mandant documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'taxagent-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own mandant documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'taxagent-documents' 
  AND auth.uid() IS NOT NULL
);