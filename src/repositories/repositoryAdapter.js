import { getApiConfig } from "../config/apiMode";

export const REPOSITORY_ADAPTERS = {
  local: "local",
  server: "server",
  supabase: "supabase",
};

export function getRepositoryAdapter(config = getApiConfig()) {
  return {
    mode: config.mode,
    baseUrl: config.baseUrl,
    isRemoteEnabled: config.isServerMode || config.isSupabaseMode,
    // Domain APIs are still synchronous today. Server mode is exposed as a
    // feature flag so individual APIs can be migrated one at a time.
    activeStorage: REPOSITORY_ADAPTERS.local,
  };
}
