import { createClient } from "@supabase/supabase-js";
import { getApiConfig } from "../config/apiMode";

let cachedClient = null;

function getSupabaseEnv() {
  const env = import.meta.env || {};
  return {
    url: env.VITE_SUPABASE_URL || "",
    publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseEnv();
  return Boolean(url && publishableKey);
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const { url, publishableKey } = getSupabaseEnv();
  if (!url || !publishableKey) {
    throw new Error("supabase_not_configured");
  }

  cachedClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}

function mapSupabaseRole(role) {
  if (role === "owner" || role === "manager") return role;
  return "hygienist";
}

function toAppUser(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    supabaseUserId: profile.id,
    clinicId: profile.clinic_id,
    name: profile.name || "사용자",
    role: mapSupabaseRole(profile.role),
    active: true,
  };
}

async function fetchProfile(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, clinic_id, name, role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return toAppUser(data);
}

export const supabaseAuthApi = {
  isEnabled() {
    return getApiConfig().mode === "supabase";
  },

  isConfigured: isSupabaseConfigured,

  async signInWithPassword({ email, password }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return fetchProfile(data.user.id);
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return fetchProfile(data.user.id);
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  },
};
