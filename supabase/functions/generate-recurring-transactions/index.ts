import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authentication: require either valid user auth OR cron secret
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let source: string = "unknown";

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = authUser.id;
      source = "user";
    } else {
      // No auth header - check for cron secret
      const cronSecret = Deno.env.get("CRON_SECRET");
      const providedSecret = req.headers.get("x-cron-secret");
      if (!cronSecret || !providedSecret || cronSecret !== providedSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      source = "cron";
    }

    // Use service role for the actual operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    console.log(`[generate-recurring] Starting generation for ${currentMonthStr}, source: ${source}, userId: ${userId || "all users (cron)"}`);

    // Get active recurring payments
    let query = supabase
      .from("recurring_payments")
      .select("*")
      .eq("is_active", true);

    // If user-initiated, only process their payments
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: payments, error: fetchError } = await query;

    if (fetchError) {
      console.error("[generate-recurring] Error fetching payments:", fetchError);
      throw fetchError;
    }

    console.log(`[generate-recurring] Found ${payments?.length || 0} active recurring payments`);

    let generated = 0;
    let skipped = 0;

    for (const payment of payments || []) {
      if (payment.last_generated_date) {
        const lastGenMonth = payment.last_generated_date.substring(0, 7);
        if (lastGenMonth >= currentMonthStr) {
          console.log(`[generate-recurring] Skipping ${payment.description} - already generated for ${lastGenMonth}`);
          skipped++;
          continue;
        }
      }

      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const actualDay = Math.min(payment.day_of_month, daysInMonth);
      const transactionDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: payment.user_id,
        category_id: payment.category_id,
        description: payment.description,
        amount: payment.amount,
        date: transactionDate,
        type: payment.type,
        notes: payment.notes ? `[Recorrente] ${payment.notes}` : "[Recorrente]",
        installment_number: 1,
        installment_total: 1,
      });

      if (insertError) {
        console.error(`[generate-recurring] Error creating transaction for ${payment.description}:`, insertError);
        continue;
      }

      const { error: updateError } = await supabase
        .from("recurring_payments")
        .update({ last_generated_date: transactionDate })
        .eq("id", payment.id);

      if (updateError) {
        console.error(`[generate-recurring] Error updating last_generated_date for ${payment.description}:`, updateError);
      }

      generated++;
      console.log(`[generate-recurring] Generated transaction for ${payment.description} on ${transactionDate}`);
    }

    console.log(`[generate-recurring] Done. Generated: ${generated}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({ generated, skipped, total: payments?.length || 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[generate-recurring] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
