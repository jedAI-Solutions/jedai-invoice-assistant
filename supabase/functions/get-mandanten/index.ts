import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Verbindung zur PostgreSQL Datenbank
    const connectionString = Deno.env.get('SUPABASE_DB_URL')
    
    if (!connectionString) {
      throw new Error('Database connection string not available')
    }

    // Verwende direkte PostgreSQL Verbindung
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    const client = new Client(connectionString)
    await client.connect()

    try {
      // Query agenda.mandantenstammdaten
      const result = await client.queryObject<{name1: string, mandant_nr: string}>(
        "SELECT name1, mandant_nr FROM agenda.mandantenstammdaten WHERE name1 IS NOT NULL ORDER BY name1"
      )

      await client.end()

      return new Response(
        JSON.stringify({ data: result.rows }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } catch (queryError) {
      await client.end()
      throw queryError
    }

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