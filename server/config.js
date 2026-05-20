import process from "node:process";

export function parseList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

export function getServerConfig(env = process.env) {
  return {
    port: Number(env.DENTALSTOCK_SERVER_PORT || 8787),
    host: env.DENTALSTOCK_SERVER_HOST || "127.0.0.1",
    allowedOrigins: parseList(env.DENTALSTOCK_ALLOWED_ORIGINS || "http://127.0.0.1:5174,http://localhost:5174"),
    rateLimitWindowMs: Number(env.DENTALSTOCK_RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMax: Number(env.DENTALSTOCK_RATE_LIMIT_MAX || 120),
    internalAdminToken: env.DENTALSTOCK_INTERNAL_ADMIN_TOKEN || "",
    credentialEncryptionKey: env.DENTALSTOCK_CREDENTIAL_ENCRYPTION_KEY || "",
    trackingProvider: env.DENTALSTOCK_TRACKING_PROVIDER || "demo",
    trackingEndpoint: env.DENTALSTOCK_TRACKING_ENDPOINT || "",
    trackingApiKey: env.DENTALSTOCK_TRACKING_API_KEY || "",
    authMode: env.DENTALSTOCK_TRUST_CLIENT_CONTEXT === "true"
      ? "test-header"
      : env.DENTALSTOCK_AUTH_MODE || "production",
  };
}
