import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MASTER_EMAIL = "monicahartmann99@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user identity server-side
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = claimsData.claims.email;
    if (userEmail !== MASTER_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for admin queries
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get AI usage stats
    const { data: usageLogs } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("user_id, tokens_input, tokens_output, estimated_cost, intent, created_at")
      .order("created_at", { ascending: false });

    // Aggregate per user
    const userMap: Record<string, { calls: number; cost: number; last_used: string; first_used: string }> = {};
    let totalCalls = 0;
    let totalCost = 0;

    for (const log of usageLogs || []) {
      totalCalls++;
      totalCost += Number(log.estimated_cost || 0);
      if (!userMap[log.user_id]) {
        userMap[log.user_id] = { calls: 0, cost: 0, last_used: log.created_at, first_used: log.created_at };
      }
      userMap[log.user_id].calls++;
      userMap[log.user_id].cost += Number(log.estimated_cost || 0);
      if (log.created_at < userMap[log.user_id].first_used) {
        userMap[log.user_id].first_used = log.created_at;
      }
    }

    // Get user emails for the usage users
    const userIds = Object.keys(userMap);
    let usersWithEmail: Array<{ user_id: string; display_name: string | null; email?: string }> = [];
    
    if (userIds.length > 0) {
      // Get profiles
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Get emails from auth
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap: Record<string, string> = {};
      for (const u of authData?.users || []) {
        emailMap[u.id] = u.email || "—";
      }

      usersWithEmail = (profiles || []).map((p) => ({
        ...p,
        email: emailMap[p.user_id] || "—",
      }));
    }

    const perUser = usersWithEmail.map((u) => ({
      user_id: u.user_id,
      display_name: u.display_name || "—",
      email: u.email,
      calls: userMap[u.user_id]?.calls || 0,
      cost: userMap[u.user_id]?.cost || 0,
      last_used: userMap[u.user_id]?.last_used || null,
      first_used: userMap[u.user_id]?.first_used || null,
    }));

    // Sort by cost descending
    perUser.sort((a, b) => b.cost - a.cost);

    return new Response(JSON.stringify({
      total_users: totalUsers || 0,
      total_ai_calls: totalCalls,
      total_cost: totalCost,
      per_user: perUser,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-stats error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
