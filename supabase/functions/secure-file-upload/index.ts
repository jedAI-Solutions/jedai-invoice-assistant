import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/tiff',
  'image/bmp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Your n8n webhook URL
const N8N_WEBHOOK_URL = 'https://jedai-solutions.app.n8n.cloud/webhook-test/afdcc912-2ca1-41ce-8ce5-ca631a2837ff';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const mandantId = formData.get('mandant_id') as string;

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'file' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing ${files.length} files for user ${user.id}`);

    // Validate mandant access if specified
    let actualMandantId = null;
    if (mandantId && mandantId !== 'all') {
      // First get the actual mandant ID from mandant_nr
      const { data: mandantData, error: mandantLookupError } = await supabase
        .from('mandants')
        .select('id')
        .eq('mandant_nr', mandantId)
        .single();

      if (mandantLookupError || !mandantData) {
        console.error('Mandant lookup error:', mandantLookupError);
        return new Response(
          JSON.stringify({ error: 'Invalid mandant specified' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      actualMandantId = mandantData.id;

      // Check user access to this mandant
      const { data: hasAccess } = await supabase
        .from('user_mandant_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('mandant_id', actualMandantId)
        .eq('is_active', true)
        .single();

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Access denied to this mandant' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate all files
    const validationErrors: string[] = [];
    const processedFiles: Array<{
      file: File;
      hash: string;
      documentId: string;
      registryId: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`File ${file.name}: too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        continue;
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        validationErrors.push(`File ${file.name}: type not allowed`);
        continue;
      }

      // Generate file hash for integrity
      const fileBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Generate unique document ID
      const documentId = `DOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8)}`;

      // Store document metadata in registry
      const { data: registryEntry, error: registryError } = await supabase
        .from('document_registry')
        .insert({
          document_id: documentId,
          original_filename: file.name,
          file_size: file.size,
          file_hash: fileHash,
          mandant_id: actualMandantId,
          upload_source: 'secure_upload',
          processing_status: 'received',
          gobd_compliant: true
        })
        .select()
        .single();

      if (registryError) {
        console.error(`Registry insert error for ${file.name}:`, registryError);
        validationErrors.push(`File ${file.name}: failed to register`);
        continue;
      }

      processedFiles.push({
        file,
        hash: fileHash,
        documentId,
        registryId: registryEntry.id
      });

      console.log(`File registered: ${file.name} -> ${documentId}`);
    }

    // If there are validation errors but some files succeeded, continue with valid files
    if (validationErrors.length > 0 && processedFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'All files failed validation',
          details: validationErrors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Forward to n8n synchronously to ensure delivery
    try {
      // Fetch mandant information if specified
      let mandantInfo = null;
      if (actualMandantId) {
        const { data: mandant, error: mandantError } = await supabase
          .from('mandants')
          .select('mandant_nr, name1')
          .eq('id', actualMandantId)
          .single();
        
        if (!mandantError && mandant) {
          mandantInfo = mandant;
        }
      }

      // Create form data for n8n with all files
      const n8nFormData = new FormData();
      
      // Add each file to the form data
      for (let i = 0; i < processedFiles.length; i++) {
        const { file, documentId, registryId } = processedFiles[i];
        n8nFormData.append(`file_${i}`, file);
        n8nFormData.append(`filename_${i}`, file.name);
        n8nFormData.append(`fileType_${i}`, file.type);
        n8nFormData.append(`fileSize_${i}`, file.size.toString());
        n8nFormData.append(`documentId_${i}`, documentId);
        n8nFormData.append(`registryId_${i}`, registryId);
      }
      
      // Add batch metadata
      n8nFormData.append('batch_size', processedFiles.length.toString());
      n8nFormData.append('user_id', user.id);
      n8nFormData.append('upload_timestamp', new Date().toISOString());
      
      // Add mandant information if available
      if (mandantInfo) {
        n8nFormData.append('mandant_id', actualMandantId);
        n8nFormData.append('mandant_nr', mandantInfo.mandant_nr);
        n8nFormData.append('mandant_name1', mandantInfo.name1);
      } else {
        n8nFormData.append('mandant_id', '');
        n8nFormData.append('mandant_nr', '');
        n8nFormData.append('mandant_name1', '');
      }

      console.log(`Forwarding ${processedFiles.length} files to n8n workflow`);

      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: n8nFormData,
      });

      console.log(`N8N response status: ${n8nResponse.status}`);

      if (n8nResponse.ok) {
        const responseText = await n8nResponse.text();
        console.log('Successfully forwarded files to n8n workflow. Response:', responseText);
        
        // Update processing status in database
        await supabase
          .from('document_registry')
          .update({ 
            processing_status: 'forwarded_to_workflow',
            verarbeitungsbeginn: new Date().toISOString()
          })
          .in('id', processedFiles.map(f => f.registryId));
      } else {
        console.error('Failed to forward to n8n:', n8nResponse.status, n8nResponse.statusText);
        
        // Update status to indicate forwarding failure
        await supabase
          .from('document_registry')
          .update({ processing_status: 'forwarding_failed' })
          .in('id', processedFiles.map(f => f.registryId));
      }
    } catch (forwardError) {
      console.error('Error forwarding to n8n:', forwardError);
      
      // Update status to indicate forwarding failure
      await supabase
        .from('document_registry')
        .update({ processing_status: 'forwarding_failed' })
        .in('id', processedFiles.map(f => f.registryId));
    }

    // Return response to user
    const response = {
      success: true,
      message: `${processedFiles.length} files processed and forwarded successfully${validationErrors.length > 0 ? ` (${validationErrors.length} failed)` : ''}`,
      processed_files: processedFiles.map(f => ({
        document_id: f.documentId,
        registry_id: f.registryId,
        file_name: f.file.name,
        file_size: f.file.size,
        file_hash: f.hash
      })),
      validation_errors: validationErrors.length > 0 ? validationErrors : undefined
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})