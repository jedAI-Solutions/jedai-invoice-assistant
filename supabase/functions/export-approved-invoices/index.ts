// Supabase Edge Function: export-approved-invoices
// Triggers an n8n webhook to export approved invoices with strict auth and authorization checks.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
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
    // Read and validate env
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const webhookUrl = Deno.env.get("N8N_EXPORT_APPROVED_INVOICES_URL") || Deno.env.get("N8N_WEBHOOK_URL") || "https://jedai-solutions.app.n8n.cloud/webhook-test/c9f0b775-5214-41fc-91af-feabfb2bc846";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase env settings");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!webhookUrl) {
      console.error("Missing webhook URL secret (N8N_EXPORT_APPROVED_INVOICES_URL or N8N_WEBHOOK_URL)");
      return new Response(JSON.stringify({ error: "Webhook URL not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Parse payload
    const body = await req.json().catch(() => ({}));
    const mandantId: string | null = body?.mandantId ?? null;
    const invoiceIds: string[] = Array.isArray(body?.invoiceIds) ? body.invoiceIds : [];

    // Minimal structured logging (no PII)
    try {
      const host = new URL(webhookUrl).host;
      console.log("export-approved-invoices invoked", {
        mandantIdPresent: !!mandantId,
        invoiceCount: invoiceIds.length,
        webhookHost: host,
      });
    } catch (_) {
      console.log("export-approved-invoices invoked", {
        mandantIdPresent: !!mandantId,
        invoiceCount: invoiceIds.length,
        webhookHost: "invalid-url",
      });
    }

    // Auth: require valid JWT and run queries under user context (RLS enforced)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.warn("Unauthorized export attempt", { reason: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Authorization: if a mandantId is provided, ensure user has access
    if (mandantId) {
      const { data: mandantRow, error: mErr } = await supabase
        .from("mandants")
        .select("id")
        .eq("id", mandantId)
        .maybeSingle();

      if (mErr || !mandantRow) {
        console.warn("Forbidden export: user lacks access to mandant", { mandantId });
        return new Response(JSON.stringify({ error: "Forbidden: no access to mandant" }), {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Authorization: if invoices are provided, ensure user can access them and they match mandantId (if set)
    if (invoiceIds.length > 0) {
      const { data: rows, error: invErr } = await supabase
        .from("approved_bookings")
        .select("id, mandant_id")
        .in("id", invoiceIds);

      if (invErr) {
        console.error("Failed to validate invoices", { error: invErr.message });
        return new Response(JSON.stringify({ error: "Invoice validation failed" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!rows || rows.length !== invoiceIds.length) {
        console.warn("Forbidden export: some invoices not accessible by user");
        return new Response(JSON.stringify({ error: "Forbidden: invalid or inaccessible invoices" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      if (mandantId && rows.some(r => r.mandant_id !== mandantId)) {
        console.warn("Export validation failed: invoices belong to a different mandant");
        return new Response(JSON.stringify({ error: "Invoices do not match specified mandant" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    }

    const payload = {
      source: "taxagent-ui",
      triggeredAt: new Date().toISOString(),
      mandantId,
      invoiceIds,
      requestedBy: userData.user.id,
    };

    console.log("Posting to n8n webhook");
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("n8n webhook failed", { status: resp.status, preview: text.slice(0, 200) });
      return new Response(
        JSON.stringify({ ok: false, status: resp.status, error: "Webhook call failed", response: text.slice(0, 200) }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("n8n webhook success", { status: resp.status });
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
