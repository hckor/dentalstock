import { readJson, sendJson } from "../http.js";

function readCredentialPayload(body = {}) {
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    const error = new Error("vendor_credentials_required");
    error.statusCode = 400;
    throw error;
  }

  if (username.length > 128 || password.length > 256) {
    const error = new Error("vendor_credentials_too_long");
    error.statusCode = 400;
    throw error;
  }

  return { username, password };
}

export async function handleVendorCredentials(req, res, { vendorCredentialService }) {
  const statusMatch = req.url.pathname.match(/^\/api\/vendor-credentials\/([^/]+)\/status$/);
  if (req.method === "GET" && statusMatch) {
    const status = await vendorCredentialService.status({ vendorId: statusMatch[1] });
    sendJson(res, 200, status);
    return true;
  }

  const writeMatch = req.url.pathname.match(/^\/api\/vendor-credentials\/([^/]+)$/);
  if (req.method === "POST" && writeMatch) {
    vendorCredentialService.assertInternalAccess(req);
    const credentials = readCredentialPayload(await readJson(req));
    const result = await vendorCredentialService.upsert({ vendorId: writeMatch[1], credentials });
    sendJson(res, 202, result);
    return true;
  }

  return false;
}
