// Supabase Edge Function: sync-accounts
// Gathers all used SKR accounts from booking overviews (ai_classifications + approved_bookings)
// and ensures they exist in chart_of_accounts. If missing, they are inserted with sane defaults.

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("sync-accounts: Missing Supabase env vars");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing Supabase env" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mandant_id?: string | null;
      mandant_nr?: string | null;
      kontenrahmen?: string | null;
    };

    const mandantId = body.mandant_id ?? null;
    let kontenrahmen = body.kontenrahmen ?? null;

    // If kontenrahmen not provided, fetch from mandant (if given)
    if (!kontenrahmen && mandantId) {
      const { data: mandant, error: mandantErr } = await supabase
        .from("mandants")
        .select("kontenrahmen")
        .eq("id", mandantId)
        .maybeSingle();
      if (mandantErr) {
        console.warn("sync-accounts: mandant fetch error", mandantErr);
      }
      kontenrahmen = mandant?.kontenrahmen ?? null;
    }

    const accountsSet = new Set<string>();

    // Collect from ai_classifications
    let aiQuery = supabase
      .from("ai_classifications")
      .select("konto, gegenkonto, mandant_id");
    if (mandantId) aiQuery = aiQuery.eq("mandant_id", mandantId);
    const { data: aiData, error: aiError } = await aiQuery;
    if (aiError) {
      console.error("sync-accounts: ai_classifications error", aiError);
      return new Response(JSON.stringify({ error: aiError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    aiData?.forEach((row: any) => {
      const k = String(row.konto || "").trim();
      const gk = String(row.gegenkonto || "").trim();
      if (k) accountsSet.add(k);
      if (gk) accountsSet.add(gk);
    });

    // Collect from approved_bookings
    let apprQuery = supabase
      .from("approved_bookings")
      .select("konto, gegenkonto, mandant_id");
    if (mandantId) apprQuery = apprQuery.eq("mandant_id", mandantId);
    const { data: apprData, error: apprError } = await apprQuery;
    if (apprError) {
      console.error("sync-accounts: approved_bookings error", apprError);
      return new Response(JSON.stringify({ error: apprError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    apprData?.forEach((row: any) => {
      const k = String(row.konto || "").trim();
      const gk = String(row.gegenkonto || "").trim();
      if (k) accountsSet.add(k);
      if (gk) accountsSet.add(gk);
    });

    const allAccounts = Array.from(accountsSet);

    // Check which accounts already exist
    let existing: { account_number: string }[] = [];
    if (allAccounts.length > 0) {
      const { data: existingData, error: existErr } = await supabase
        .from("chart_of_accounts")
        .select("account_number")
        .in("account_number", allAccounts);
      if (existErr) {
        console.error("sync-accounts: existing fetch error", existErr);
        return new Response(JSON.stringify({ error: existErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      existing = existingData ?? [];
    }

    const existingSet = new Set(existing.map((e) => String(e.account_number)));
    const missing = allAccounts.filter((acc) => !existingSet.has(String(acc)));

    let inserted = 0;
    if (missing.length > 0) {
      const rows = missing.map((acc) => ({
        account_number: String(acc),
        account_name: `SKR ${String(acc)}`,
        kontenrahmen: kontenrahmen ?? "SKR03",
        is_active: true,
        language_id: "de-DE",
      }));

      const { error: insertErr, count } = await supabase
        .from("chart_of_accounts")
        .insert(rows, { count: "exact" });
      if (insertErr) {
        console.error("sync-accounts: insert error", insertErr);
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      inserted = count ?? rows.length;
    }

    const result = {
      processed: allAccounts.length,
      inserted,
      skipped_existing: allAccounts.length - inserted,
      mandant_id: mandantId,
      kontenrahmen: kontenrahmen ?? "SKR03",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("sync-accounts: unexpected error", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
