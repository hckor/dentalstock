const DEFAULT_API_BASE_URL = "http://127.0.0.1:8787";

function readEnv() {
  return import.meta.env || {};
}

export function getApiConfig(env = readEnv()) {
  const mode = env.VITE_DENTALSTOCK_API_MODE === "server" ? "server" : "local";
  return {
    mode,
    baseUrl: env.VITE_DENTALSTOCK_API_BASE_URL || DEFAULT_API_BASE_URL,
    isServerMode: mode === "server",
  };
}
