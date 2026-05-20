import { getServerConfig } from "./config.js";
import { createHttpServer, notFound, sendJson } from "./http.js";
import { applyCors, applySecurityHeaders, createRateLimiter, readRequestContext } from "./middleware.js";
import { handleHealth } from "./routes/health.js";
import { handleOrders } from "./routes/orders.js";
import { handleTracking } from "./routes/tracking.js";
import { handleVendorCredentials } from "./routes/vendorCredentials.js";
import { createTrackingService } from "./services/trackingService.js";
import { createVendorCredentialService } from "./services/vendorCredentialService.js";

export function createDentalStockHandler({ env } = {}) {
  const config = getServerConfig(env);
  const rateLimit = createRateLimiter({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  });
  const services = {
    trackingService: createTrackingService(),
    vendorCredentialService: createVendorCredentialService({
      internalAdminToken: config.internalAdminToken,
    }),
  };

  const handler = async (req, res) => {
    try {
      applySecurityHeaders(res);
      applyCors(req, res, config.allowedOrigins);

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (!rateLimit(req, res)) return;

      req.url = new URL(req.url, "http://localhost");
      const context = readRequestContext(req);
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
      sendJson(res, error.statusCode || 500, { error: error.message || "internal_server_error" });
    }
  };

  return { handler, config, services };
}

export function createDentalStockServer({ env } = {}) {
  const { handler, config, services } = createDentalStockHandler({ env });
  const server = createHttpServer(handler);

  return { server, config, services, handler };
}
