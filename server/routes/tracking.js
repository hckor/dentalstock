import { readJson, sendJson } from "../http.js";

export async function handleTracking(req, res, { trackingService }) {
  if (req.method !== "POST" || req.url.pathname !== "/api/tracking/refresh") return false;

  const body = await readJson(req);
  const tracking = await trackingService.refresh({
    carrier: body.carrier,
    trackingNumber: body.trackingNumber,
    currentStatuses: body.currentStatuses,
  });

  sendJson(res, 200, tracking);
  return true;
}
