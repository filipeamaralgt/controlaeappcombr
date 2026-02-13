import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    log("ERROR: Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  // CRITICAL: Read body as raw text for signature verification
  const body = await req.text();

  let event: Stripe.Event;
  try {
    // CRITICAL: Use createSubtleCryptoProvider for Deno compatibility
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    log("ERROR: Signature verification failed", { error: String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) {
          log("WARN: No user_id in metadata");
          break;
        }

        const subscriptionId = session.subscription as string;
        log("Retrieving subscription", { subscriptionId });
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        log("Subscription retrieved (raw)", { 
          current_period_end: sub.current_period_end,
          current_period_end_type: typeof sub.current_period_end,
          trial_end: (sub as any).trial_end,
          status: sub.status,
          items: sub.items?.data?.length 
        });

        const plan = sub.items.data[0]?.plan;
        const interval = plan?.interval === "year" ? "anual" : "mensal";

        // Determine period end - try current_period_end, then trial_end
        let periodEnd: string | null = null;
        const rawEnd = sub.current_period_end || (sub as any).trial_end;
        if (rawEnd) {
          // Force to number regardless of what Stripe SDK returns
          const ts = Number(rawEnd);
          if (!isNaN(ts) && ts > 0) {
            periodEnd = new Date(ts * 1000).toISOString();
          }
        }
        // Fallback: set 30 days from now if still null
        if (!periodEnd) {
          periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        log("Period end calculated", { periodEnd, rawEnd });

        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            provider: "stripe",
            status: "active",
            plan: interval,
            external_id: subscriptionId,
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" }
        );

        if (error) log("ERROR: upsert failed", error);
        else log("SUCCESS: subscription activated", { userId, subscriptionId });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const status = sub.status === "active" ? "active" : sub.status === "trialing" ? "trial" : "canceled";
        const plan = sub.items.data[0]?.plan;
        const interval = plan?.interval === "year" ? "anual" : "mensal";

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            provider: "stripe",
            status,
            plan: interval,
            external_id: sub.id,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          },
          { onConflict: "user_id" }
        );
        log("Subscription updated", { userId, status });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("user_id", userId);
        log("Subscription canceled", { userId });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", userId);
        log("Payment failed → expired", { userId });
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    log("ERROR processing event", { error: String(err) });
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
