import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";

async function readFunctionError(error) {
  const response = error?.context;
  if (!response) return error?.message;

  try {
    const body = await response.clone().json();
    return body?.error || body?.message || error?.message;
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return error?.message;
    }
  }
}

export const supabasePriceMonitorApi = {
  isEnabled() {
    const config = getApiConfig();
    return config.isSupabaseMode && isSupabaseConfigured();
  },

  async run({ limit = 20, itemId = "" } = {}) {
    const { data, error } = await getSupabaseClient()
      .functions
      .invoke("price-monitor", { body: { limit, item_id: itemId || undefined } });

    if (error) throw new Error(await readFunctionError(error));
    if (data?.error) throw new Error(data.error);
    return data;
  },
};
