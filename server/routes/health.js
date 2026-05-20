import { sendJson } from "../http.js";

export function handleHealth(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
    return true;
  }

  sendJson(res, 200, {
    ok: true,
    service: "dentalstock-api",
    mode: "skeleton",
    timestamp: new Date().toISOString(),
  });
  return true;
}
