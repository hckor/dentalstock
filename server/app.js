import { getServerConfig } from "./config.js";
import { createHttpServer, notFound, sendJson } from "./http.js";
import { createAuthService } from "./authService.js";
import { applyCors, applySecurityHeaders, createRateLimiter } from "./middleware.js";
import { handleHealth } from "./routes/health.js";
import { handleOrders } from "./routes/orders.js";
import { handleTracking } from "./routes/tracking.js";
import { handleVendorCredentials } from "./routes/vendorCredentials.js";
import { createAuditLogService } from "./services/auditLogService.js";
import { createEncryptedCredentialStore } from "./services/encryptedCredentialStore.js";
import { createHttpTrackingClient, createTrackingService } from "./services/trackingService.js";
import { createVendorCredentialService } from "./services/vendorCredentialService.js";
import { createMemoryStore } from "./storage/memoryStore.js";

export function createDentalStockHandler({ env, authProvider } = {}) {
  const config = getServerConfig(env);
  const rateLimit = createRateLimiter({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  });
  const memoryStore = createMemoryStore();
  const credentialStore = config.credentialEncryptionKey
    ? createEncryptedCredentialStore({ encryptionKey: config.credentialEncryptionKey })
    : null;
  const externalTrackingClient = config.trackingProvider === "external" && config.trackingEndpoint && config.trackingApiKey
    ? createHttpTrackingClient({ endpoint: config.trackingEndpoint, apiKey: config.trackingApiKey })
    : null;
  const authService = createAuthService({
    mode: config.authMode,
    authProvider,
    internalAdminToken: config.internalAdminToken,
  });
  const services = {
    auditLogService: createAuditLogService({ auditLogStore: memoryStore.auditLogs }),
    authService,
    orderJobStore: memoryStore.orderJobs,
    store: memoryStore,
    trackingService: createTrackingService({ provider: config.trackingProvider, externalClient: externalTrackingClient }),
    vendorCredentialService: createVendorCredentialService({
      authService,
      internalAdminToken: config.internalAdminToken,
      credentialStore,
    }),
  };

  const handler = async (req, res) => {
    try {
      applySecurityHeaders(res);
      if (!applyCors(req, res, config.allowedOrigins)) return;

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (!rateLimit(req, res)) return;

      req.url = new URL(req.url, "http://localhost");
      const context = await authService.readRequestContext(req);
      const routeContext = { ...services, context, config };

      if (req.url.pathname === "/health") {
        handleHealth(req, res);
        return;
      }

      if (await handleOrders(req, res, routeContext)) return;
      if (await handleTracking(req, res, routeContext)) return;
      if (await handleVendorCredentials(req, res, routeContext)) return;

      notFound(res);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const message = error.statusCode ? error.message || "request_failed" : "internal_server_error";
      sendJson(res, statusCode, { error: message });
    }
  };

  return { handler, config, services };
}

export function createDentalStockServer({ env, authProvider } = {}) {
  const { handler, config, services } = createDentalStockHandler({ env, authProvider });
  const server = createHttpServer(handler);

  return { server, config, services, handler };
}
