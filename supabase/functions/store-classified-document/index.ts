import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body - expecting classification results and document data
    const body = await req.json();
    const { 
      document_id, 
      registry_id, 
      file_data, // base64 encoded file data
      file_name,
      file_type,
      classification_result,
      mandant_id
    } = body;

    console.log('Storing classified document:', document_id);

    if (!document_id || !registry_id || !file_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: document_id, registry_id, file_data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert base64 to blob
    let fileBuffer: ArrayBuffer;
    try {
      const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileBuffer = bytes.buffer;
    } catch (decodeError) {
      console.error('Error decoding base64 file data:', decodeError);
      return new Response(
        JSON.stringify({ error: 'Invalid file data format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate storage path: documents/{mandant_id}/{document_id}/{file_name}
    const storagePath = mandant_id 
      ? `${mandant_id}/${document_id}/${file_name}`
      : `unassigned/${document_id}/${file_name}`;

    console.log('Storage path:', storagePath);

    // Upload file to Supabase storage
const { data: storageData, error: storageError } = await supabase.storage
  .from('taxagent-documents')
  .upload(storagePath, fileBuffer, {
    contentType: file_type,
    upsert: true
  });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload document to storage',
          details: storageError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Document uploaded to storage:', storageData.path);

    // Update document registry with storage path
    const { error: registryUpdateError } = await supabase
      .from('document_registry')
      .update({ 
        processing_status: 'stored',
        verarbeitungsende: new Date().toISOString()
      })
      .eq('id', registry_id);

    if (registryUpdateError) {
      console.error('Registry update error:', registryUpdateError);
    }

    // Update AI classification with document URL if classification result provided
    if (classification_result && classification_result.id) {
      const { error: classificationUpdateError } = await supabase
        .from('ai_classifications')
        .update({ 
          document_url: storageData.path,
          status: 'completed'
        })
        .eq('id', classification_result.id);

      if (classificationUpdateError) {
        console.error('Classification update error:', classificationUpdateError);
      }
    }

    // Get signed URL for immediate access
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from('taxagent-documents')
  .createSignedUrl(storageData.path, 3600); // 1 hour expiry

    const response = {
      success: true,
      message: 'Document stored successfully',
      storage_path: storageData.path,
      signed_url: signedUrlData?.signedUrl,
      document_id,
      registry_id
    };

    console.log('Document storage completed successfully');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Document storage error:', error);
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
});