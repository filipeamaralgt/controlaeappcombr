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

/** Try to find a Supabase user by email */
async function findUserByEmail(email: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1 });
  // listUsers doesn't support email filter, so search via profiles or iterate
  // Better approach: use the admin API to get user by email
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error || !users?.users) return null;
  const found = users.users.find((u) => u.email === email);
  return found?.id ?? null;
}

/** Try to find user_id from metadata or by customer email */
async function resolveUserId(
  metadata: Record<string, string> | null | undefined,
  customerEmail: string | null | undefined
): Promise<string | null> {
  // First try metadata
  if (metadata?.user_id) return metadata.user_id;
  // Then try by email
  if (customerEmail) return await findUserByEmail(customerEmail);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    log("ERROR: Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
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
        const customerEmail = session.customer_email || session.customer_details?.email;
        const userId = await resolveUserId(
          session.metadata as Record<string, string>,
          customerEmail
        );

        const subscriptionId = session.subscription as string;
        let sub: Stripe.Subscription | null = null;
        let interval = "mensal";
        let periodEnd: string | null = null;

        if (subscriptionId) {
          log("Retrieving subscription", { subscriptionId });
          sub = await stripe.subscriptions.retrieve(subscriptionId);
          const plan = sub.items.data[0]?.plan;
          interval = plan?.interval === "year" ? "anual" : "mensal";

          const rawEnd = sub.current_period_end || (sub as any).trial_end;
          if (rawEnd) {
            const ts = Number(rawEnd);
            if (!isNaN(ts) && ts > 0) {
              periodEnd = new Date(ts * 1000).toISOString();
            }
          }
          if (!periodEnd) {
            periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
        }

        // Update lead by email
        if (customerEmail) {
          const paymentMethod = session.payment_method_types?.[0] || null;
          const paymentDate = new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString();

          const { error: leadError } = await supabase
            .from("leads")
            .update({
              status: "assinante",
              subscription_type: interval,
              payment_method: paymentMethod,
              payment_date: paymentDate,
              subscription_end: periodEnd,
              canceled_at: null,
            } as any)
            .eq("email", customerEmail.toLowerCase());

          if (leadError) log("WARN: lead update failed", leadError);
          else log("Lead updated", { email: customerEmail, status: "assinante", plan: interval });
        }

        // Update subscription table
        if (!userId) {
          log("INFO: No user found yet — subscription will be linked on login via check-subscription", { email: customerEmail });
          break;
        }

        if (subscriptionId) {
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
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        
        // Try to find user by metadata or customer email
        let userId = sub.metadata?.user_id;
        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (customer && !customer.deleted && customer.email) {
            userId = await findUserByEmail(customer.email) ?? undefined;
          }
        }
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
        let customerEmail: string | null = null;
        let userId = sub.metadata?.user_id;
        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (customer && !customer.deleted && customer.email) {
            customerEmail = customer.email;
            userId = await findUserByEmail(customer.email) ?? undefined;
          }
        }

        // Update lead status to cancelado
        if (customerEmail) {
          const canceledAt = new Date().toISOString();
          const { error: leadError } = await supabase
            .from("leads")
            .update({ status: "cancelado", canceled_at: canceledAt } as any)
            .eq("email", customerEmail.toLowerCase());
          if (leadError) log("WARN: lead cancel update failed", leadError);
          else log("Lead status set to cancelado", { email: customerEmail, canceled_at: canceledAt });
        }

        if (userId) {
          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
          log("Subscription canceled", { userId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        let userId = sub.metadata?.user_id;
        if (!userId) {
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (customer && !customer.deleted && customer.email) {
            userId = await findUserByEmail(customer.email) ?? undefined;
          }
        }
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
