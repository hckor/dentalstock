import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROFILE_SELECT = "id, clinic_id, email, name, role, is_active, disabled_at, last_seen_at, created_at, updated_at";
const INVITABLE_ROLES = new Set(["manager", "hygienist", "staff"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getEnv(name: string) {
  return Deno.env.get(name) || "";
}

function getPublicApiKey() {
  return getEnv("SUPABASE_ANON_KEY") || getEnv("SUPABASE_PUBLISHABLE_KEY") || getEnv("SUPABASE_PUBLISHABLE_KEYS");
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeName(value: unknown, email: string) {
  const name = String(value || "").trim();
  return name || email.split("@")[0] || "직원";
}

function normalizeRole(value: unknown) {
  const role = String(value || "hygienist").trim().toLowerCase();
  return INVITABLE_ROLES.has(role) ? role : "hygienist";
}

function normalizeRedirectUrl(value: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function mapInviteError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("already")) return "user_already_exists";
  if (message.includes("rate")) return "invite_email_rate_limited";
  if (message.includes("redirect")) return "invite_redirect_invalid";
  if (message.includes("smtp") || message.includes("email")) return "invite_delivery_unavailable";
  return "invite_failed";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const publicApiKey = getPublicApiKey();
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publicApiKey || !serviceRoleKey) {
    return json({ error: "server_not_configured" }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return json({ error: "authentication_required" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = normalizeEmail(payload.email);
  const name = normalizeName(payload.name, email);
  const role = normalizeRole(payload.role);

  if (!email || !email.includes("@")) {
    return json({ error: "invalid_email" }, 400);
  }

  const userClient = createClient(supabaseUrl, publicApiKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: "authentication_required" }, 401);
  }

  const { data: actorProfile, error: actorError } = await userClient
    .from("profiles")
    .select("id, clinic_id, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (actorError || !actorProfile?.is_active || actorProfile.role !== "owner") {
    return json({ error: "owner_required" }, 403);
  }

  const redirectTo = normalizeRedirectUrl(getEnv("INVITE_REDIRECT_URL"));
  if (redirectTo === null) {
    return json({ error: "invite_redirect_invalid" }, 500);
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      clinic_id: actorProfile.clinic_id,
      invited_by: actorProfile.id,
      name,
      role,
    },
    redirectTo,
  });

  if (inviteError || !inviteData.user) {
    return json({ error: mapInviteError(inviteError) }, 400);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: inviteData.user.id,
      clinic_id: actorProfile.clinic_id,
      email,
      name,
      role,
      is_active: true,
      disabled_at: null,
    }, { onConflict: "id" })
    .select(PROFILE_SELECT)
    .single();

  if (profileError) {
    return json({ error: "profile_create_failed" }, 500);
  }

  await adminClient
    .from("audit_logs")
    .insert({
      clinic_id: actorProfile.clinic_id,
      actor_id: actorProfile.id,
      action: "staff.invited",
      target_type: "profile",
      target_id: profile.id,
      metadata: { email, name, role },
    });

  return json({ profile });
});
