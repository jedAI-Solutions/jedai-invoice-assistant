import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Erstelle eine temporäre Funktion für den SQL-Aufruf
    const { data: createFuncData, error: createFuncError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_mandantenstammdaten()
        RETURNS TABLE(name1 text, mandant_nr text)
        LANGUAGE sql
        AS $$
          SELECT name1, mandant_nr 
          FROM agenda.mandantenstammdaten 
          WHERE name1 IS NOT NULL 
          ORDER BY name1;
        $$;
      `
    })

    if (createFuncError) {
      console.error('Error creating function:', createFuncError)
    }

    // Rufe die Funktion auf
    const { data, error } = await supabaseClient.rpc('get_mandantenstammdaten')

    if (error) {
      console.error('Error fetching mandanten:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})