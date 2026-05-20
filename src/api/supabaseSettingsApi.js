import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";
import { settingsApi } from "./settingsApi";

function mapSupabaseSettings(row = {}) {
  const reorderRules = row.reorder_rules && typeof row.reorder_rules === "object" ? row.reorder_rules : {};
  const appConfig = row.app_config && typeof row.app_config === "object" ? row.app_config : {};

  return settingsApi.normalize({
    vendors: Array.isArray(row.vendors) ? row.vendors : [],
    preferredVendor: reorderRules.preferredVendor ?? appConfig.preferredVendor,
    maxOrderAmount: reorderRules.maxOrderAmount ?? appConfig.maxOrderAmount,
  });
}

function toSettingsPayload(clinicId, settings) {
  const safeSettings = settingsApi.normalize(settings);
  return {
    clinic_id: clinicId,
    vendors: safeSettings.vendors,
    reorder_rules: {
      preferredVendor: safeSettings.preferredVendor,
      maxOrderAmount: safeSettings.maxOrderAmount,
    },
    app_config: {},
  };
}

export const supabaseSettingsApi = {
  isEnabled() {
    const config = getApiConfig();
    return config.isSupabaseMode && isSupabaseConfigured();
  },

  async getForClinic(clinicId) {
    if (!clinicId) return null;
    const { data, error } = await getSupabaseClient()
      .from("settings")
      .select("clinic_id, vendors, reorder_rules, app_config, updated_at")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapSupabaseSettings(data) : null;
  },

  async saveForClinic(clinicId, settings) {
    if (!clinicId) throw new Error("clinic_id_required");
    const { data, error } = await getSupabaseClient()
      .from("settings")
      .upsert(toSettingsPayload(clinicId, settings), { onConflict: "clinic_id" })
      .select("clinic_id, vendors, reorder_rules, app_config, updated_at")
      .single();

    if (error) throw error;
    return mapSupabaseSettings(data);
  },
};
