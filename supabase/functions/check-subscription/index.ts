import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");

    const userId = userData.user.id;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer — mark as expired in DB if exists
      await supabaseClient
        .from("subscriptions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("provider", "stripe")
        .neq("status", "expired");

      return new Response(JSON.stringify({ subscribed: false, premium: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Check active + trialing
    const [activeSubs, trialSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 }),
    ]);

    const allSubs = [...activeSubs.data, ...trialSubs.data];
    const hasActive = allSubs.length > 0;

    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let isTrial = false;
    let plan: string = "mensal";
    let externalId: string | null = null;
    let status: string = "expired";

    if (hasActive) {
      const sub = allSubs[0];
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      productId = sub.items.data[0].price.product as string;
      isTrial = sub.status === "trialing";
      externalId = sub.id;
      status = isTrial ? "trial" : "active";

      // Determine plan based on interval
      const interval = sub.items.data[0].price.recurring?.interval;
      plan = interval === "year" ? "anual" : "mensal";
    }

    // Upsert into subscriptions table
    const { data: existing } = await supabaseClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "stripe")
      .maybeSingle();

    if (existing) {
      await supabaseClient
        .from("subscriptions")
        .update({
          status,
          plan,
          external_id: externalId,
          current_period_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else if (hasActive) {
      await supabaseClient.from("subscriptions").insert({
        user_id: userId,
        provider: "stripe",
        status,
        plan,
        external_id: externalId,
        current_period_end: subscriptionEnd,
      });
    }

    const premium = hasActive && subscriptionEnd ? new Date(subscriptionEnd) > new Date() : false;

    return new Response(
      JSON.stringify({
        subscribed: hasActive,
        premium,
        product_id: productId,
        subscription_end: subscriptionEnd,
        is_trial: isTrial,
        plan,
        provider: "stripe",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
