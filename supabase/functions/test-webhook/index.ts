// Test webhook function to verify n8n connectivity
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const webhookUrl = "https://jedai-solutions.app.n8n.cloud/webhook-test/c9f0b775-5214-41fc-91af-feabfb2bc846";
    
    console.log("Testing webhook URL:", webhookUrl);
    
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Test webhook from Supabase Edge Function"
    };
    
    console.log("Sending test payload:", JSON.stringify(testPayload));
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Supabase-Edge-Function/Test"
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    
    console.log("Webhook response status:", response.status);
    console.log("Webhook response headers:", Object.fromEntries(response.headers.entries()));
    console.log("Webhook response body:", responseText);
    
    return new Response(JSON.stringify({
      success: true,
      webhookStatus: response.status,
      webhookResponse: responseText,
      url: webhookUrl
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Test webhook error:", error);
    return new Response(JSON.stringify({
      error: "Test failed",
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});