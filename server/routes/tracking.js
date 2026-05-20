import { readJson, sendJson } from "../http.js";

const TRACKING_ROLES = new Set(["owner", "manager"]);

export async function handleTracking(req, res, { trackingService, context }) {
  if (req.method !== "POST" || req.url.pathname !== "/api/tracking/refresh") return false;
  if (!TRACKING_ROLES.has(context?.role)) {
    sendJson(res, 403, { error: "tracking_forbidden" });
    return true;
  }

  const body = await readJson(req);
  const tracking = await trackingService.refresh({
    carrier: body.carrier,
    trackingNumber: body.trackingNumber,
    currentStatuses: body.currentStatuses,
  });

  sendJson(res, 200, tracking);
  return true;
}
