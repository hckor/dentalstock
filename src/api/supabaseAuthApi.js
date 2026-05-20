import { createClient } from "@supabase/supabase-js";
import { getApiConfig } from "../config/apiMode";
import { PROFILE_SELECT, mapSupabaseProfile } from "./supabaseProfileMapper";

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

function toAppUser(profile) {
  if (!profile) return null;
  const user = mapSupabaseProfile(profile);
  if (!user.active) {
    throw new Error("inactive_profile");
  }
  return user;
}

async function fetchProfile(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
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
