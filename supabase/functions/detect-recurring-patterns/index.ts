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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 6 months of transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sinceDate = sixMonthsAgo.toISOString().substring(0, 10);

    const { data: transactions, error: txError } = await userClient
      .from("transactions")
      .select("*, categories(id, name, color, type)")
      .gte("date", sinceDate)
      .eq("type", "expense")
      .order("date");

    if (txError) throw txError;

    // Fetch existing reminders to avoid suggesting duplicates
    const { data: existingReminders } = await userClient
      .from("reminders")
      .select("name, amount");

    const existingSet = new Set(
      (existingReminders || []).map((r: any) => `${r.name.toLowerCase()}|${r.amount}`)
    );

    // Also fetch recurring payments to avoid duplicates
    const { data: existingRecurring } = await userClient
      .from("recurring_payments")
      .select("description, amount");

    const recurringSet = new Set(
      (existingRecurring || []).map((r: any) => `${r.description.toLowerCase()}|${r.amount}`)
    );

    // Group by description + amount (normalized)
    const groups: Record<string, {
      description: string;
      amount: number;
      dates: string[];
      category_id: string;
      category_name: string;
      category_color: string;
    }> = {};

    for (const tx of transactions || []) {
      // Skip installments (already managed separately)
      if (tx.installment_total && tx.installment_total > 1) continue;
      // Skip recurring-generated transactions
      if (tx.notes && tx.notes.includes("[Recorrente]")) continue;

      const key = `${tx.description.toLowerCase()}|${tx.amount}`;
      if (!groups[key]) {
        groups[key] = {
          description: tx.description,
          amount: Number(tx.amount),
          dates: [],
          category_id: tx.category_id,
          category_name: tx.categories?.name || "",
          category_color: tx.categories?.color || "#6366f1",
        };
      }
      groups[key].dates.push(tx.date);
    }

    // Categories to exclude from suggestions
    const excludedCategories = ["alimentação", "alimentacao"];

    // Find patterns: at least 3 occurrences in different months
    const suggestions = [];
    for (const [key, group] of Object.entries(groups)) {
      // Skip if already a reminder or recurring payment
      if (existingSet.has(key) || recurringSet.has(key)) continue;
      // Skip excluded categories
      if (excludedCategories.includes(group.category_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) continue;

      const months = new Set(group.dates.map((d) => d.substring(0, 7)));
      if (months.size >= 3) {
        // Calculate most common day
        const days = group.dates.map((d) => parseInt(d.substring(8, 10)));
        const dayCount: Record<number, number> = {};
        for (const day of days) {
          dayCount[day] = (dayCount[day] || 0) + 1;
        }
        const mostCommonDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

        suggestions.push({
          description: group.description,
          amount: group.amount,
          day_of_month: parseInt(mostCommonDay[0]),
          occurrences: months.size,
          category_id: group.category_id,
          category_name: group.category_name,
          category_color: group.category_color,
        });
      }
    }

    // Sort by occurrences desc
    suggestions.sort((a, b) => b.occurrences - a.occurrences);

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 10) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[detect-patterns] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
