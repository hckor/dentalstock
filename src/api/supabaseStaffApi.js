import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";
import { PROFILE_SELECT, mapSupabaseProfile, toSupabaseRole } from "./supabaseProfileMapper";

function isEnabled() {
  const config = getApiConfig();
  return config.isSupabaseMode && isSupabaseConfigured();
}

export const supabaseStaffApi = {
  isEnabled,

  async listByClinic(clinicId) {
    if (!clinicId) return [];

    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("clinic_id", clinicId)
      .order("is_active", { ascending: false })
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSupabaseProfile);
  },

  async setActive(profileId, isActive) {
    const { data, error } = await getSupabaseClient()
      .rpc("set_profile_active", {
        p_profile_id: profileId,
        p_is_active: Boolean(isActive),
      });

    if (error) throw error;
    return mapSupabaseProfile(data);
  },

  async setRole(profileId, role) {
    const { data, error } = await getSupabaseClient()
      .rpc("set_profile_role", {
        p_profile_id: profileId,
        p_role: toSupabaseRole(role),
      });

    if (error) throw error;
    return mapSupabaseProfile(data);
  },

  async inviteStaff({ email, name, role }) {
    const { data, error } = await getSupabaseClient()
      .functions
      .invoke("invite-staff", {
        body: {
          email,
          name,
          role: toSupabaseRole(role),
        },
      });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return mapSupabaseProfile(data?.profile || data);
  },

  async updateMyProfile(name) {
    const { data, error } = await getSupabaseClient()
      .rpc("update_my_profile", { p_name: name });

    if (error) throw error;
    return mapSupabaseProfile(data);
  },
};
