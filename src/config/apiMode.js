const DEFAULT_API_BASE_URL = "http://127.0.0.1:8787";

function readEnv() {
  return import.meta.env || {};
}

export function getApiConfig(env = readEnv()) {
  const testShouldStayLocal = env.MODE === "test" && env.VITE_DENTALSTOCK_ENABLE_REMOTE_IN_TESTS !== "true";
  const requestedMode = testShouldStayLocal ? "local" : env.VITE_DENTALSTOCK_API_MODE;
  const mode = ["server", "supabase"].includes(requestedMode)
    ? requestedMode
    : "local";
  return {
    mode,
    baseUrl: env.VITE_DENTALSTOCK_API_BASE_URL || DEFAULT_API_BASE_URL,
    isServerMode: mode === "server",
    isSupabaseMode: mode === "supabase",
  };
}
