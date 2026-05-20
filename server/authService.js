const DEFAULT_CONTEXT = Object.freeze({
  clinicId: "demo-clinic",
  userId: "anonymous",
  role: "unknown",
  authMode: "anonymous",
});

const SAFE_CONTEXT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

export function isSafeContextValue(value) {
  return typeof value === "string" && SAFE_CONTEXT_PATTERN.test(value);
}

export function sanitizeContext(context = {}, authMode = "authenticated") {
  return {
    clinicId: isSafeContextValue(context.clinicId) ? context.clinicId : DEFAULT_CONTEXT.clinicId,
    userId: isSafeContextValue(context.userId) ? context.userId : DEFAULT_CONTEXT.userId,
    role: isSafeContextValue(context.role) ? context.role : DEFAULT_CONTEXT.role,
    authMode,
  };
}

export function readBearerToken(req) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== "string") return "";
  const match = authorization.match(BEARER_PATTERN);
  return match ? match[1].trim() : "";
}

export function createUnconfiguredAuthProvider() {
  return {
    async verifyBearerToken() {
      const error = new Error("auth_provider_not_configured");
      error.statusCode = 503;
      throw error;
    },
  };
}

export function createStaticBearerAuthProvider({ tokens = {} } = {}) {
  return {
    async verifyBearerToken(token) {
      const context = tokens[token];
      if (!context) {
        const error = new Error("invalid_bearer_token");
        error.statusCode = 401;
        throw error;
      }
      return sanitizeContext(context, "bearer");
    },
  };
}

function hasAuthProvider(authProvider) {
  return authProvider && typeof authProvider.verifyBearerToken === "function";
}

export function createAuthService({
  mode = "production",
  authProvider = null,
  internalAdminToken = "",
} = {}) {
  const provider = hasAuthProvider(authProvider) ? authProvider : createUnconfiguredAuthProvider();
  const isTestHeaderMode = mode === "test-header";

  return {
    mode,

    async readRequestContext(req) {
      if (isTestHeaderMode) {
        return sanitizeContext({
          clinicId: req.headers["x-clinic-id"],
          userId: req.headers["x-user-id"],
          role: req.headers["x-user-role"],
        }, "test-header");
      }

      const token = readBearerToken(req);
      if (!token) return { ...DEFAULT_CONTEXT };

      try {
        return sanitizeContext(await provider.verifyBearerToken(token), "bearer");
      } catch (error) {
        if (error.statusCode === 503) return { ...DEFAULT_CONTEXT };
        throw error;
      }
    },

    assertInternalAccess(req) {
      if (!internalAdminToken) {
        const error = new Error("internal_auth_not_configured");
        error.statusCode = 503;
        throw error;
      }

      if (req.headers["x-internal-admin-token"] !== internalAdminToken) {
        const error = new Error("forbidden");
        error.statusCode = 403;
        throw error;
      }
    },
  };
}
