import { sendJson } from "./http.js";

export function applySecurityHeaders(res) {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("cache-control", "no-store");
}

export function applyCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    sendJson(res, 403, { error: "origin_not_allowed" });
    return false;
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization,content-type,x-clinic-id,x-user-id,x-user-role,x-internal-admin-token");
  return true;
}

export function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();

  return function rateLimit(req, res) {
    const now = Date.now();
    const key = req.socket.remoteAddress || "unknown";
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt > windowMs) {
      buckets.set(key, { count: 1, startedAt: now });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      sendJson(res, 429, { error: "rate_limited" });
      return false;
    }
    return true;
  };
}
