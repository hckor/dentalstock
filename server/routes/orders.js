import { readJson, sendJson } from "../http.js";
import { executeOrderAction } from "../services/orderActionService.js";

const ORDER_ACTION_BY_PATH = {
  approve: "approve",
  reject: "reject",
  tracking: "tracking",
  receive: "receive",
};

export async function handleOrders(req, res, { context, auditLogService, orderJobStore }) {
  if (req.method === "GET" && req.url.pathname === "/api/orders") {
    sendJson(res, 200, {
      clinicId: context.clinicId,
      data: [],
      source: "backend-skeleton",
    });
    return true;
  }

  const actionMatch = req.url.pathname.match(/^\/api\/orders\/([^/]+)\/(approve|reject|tracking|receive)$/);
  if (req.method === "POST" && actionMatch) {
    const body = await readJson(req);
    const actionResult = await executeOrderAction({
      action: ORDER_ACTION_BY_PATH[actionMatch[2]],
      orderId: decodeURIComponent(actionMatch[1]),
      body,
      context,
      auditLogService,
      orderJobStore,
    });
    sendJson(res, 202, actionResult);
    return true;
  }

  return false;
}
