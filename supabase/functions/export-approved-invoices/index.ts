// Supabase Edge Function: export-approved-invoices
// Triggers an n8n webhook to export approved invoices. Does not modify DB state.
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
    const body = await req.json().catch(() => ({}));
    const mandantId = body?.mandantId ?? null;
    const invoiceIds = Array.isArray(body?.invoiceIds) ? body.invoiceIds : [];

    const webhookUrl =
      Deno.env.get("N8N_EXPORT_APPROVED_INVOICES_URL") ||
      Deno.env.get("N8N_WEBHOOK_URL") ||
      "https://jedai-solutions.app.n8n.cloud/webhook-test/c9f0b775-5214-41fc-91af-feabfb2bc846"; // fallback test URL

    const payload = {
      source: "taxagent-ui",
      triggeredAt: new Date().toISOString(),
      mandantId,
      invoiceIds,
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("n8n webhook failed", { status: resp.status, text });
      return new Response(
        JSON.stringify({ ok: false, status: resp.status, error: "Webhook call failed", response: text }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ ok: true, status: resp.status }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("export-approved-invoices error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
