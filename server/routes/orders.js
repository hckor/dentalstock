import { readJson, sendJson } from "../http.js";

export async function handleOrders(req, res, { context }) {
  if (req.method === "GET" && req.url.pathname === "/api/orders") {
    sendJson(res, 200, {
      clinicId: context.clinicId,
      data: [],
      source: "backend-skeleton",
    });
    return true;
  }

  const approveMatch = req.url.pathname.match(/^\/api\/orders\/([^/]+)\/approve$/);
  if (req.method === "POST" && approveMatch) {
    const body = await readJson(req);
    sendJson(res, 202, {
      queued: true,
      action: "approve",
      orderId: approveMatch[1],
      clinicId: context.clinicId,
      requestedBy: context.userId,
      reviewNote: body.reviewNote || "",
    });
    return true;
  }

  return false;
}
