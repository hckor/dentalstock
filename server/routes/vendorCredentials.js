import { readJson, sendJson } from "../http.js";

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
    await readJson(req);
    const result = await vendorCredentialService.upsert({ vendorId: writeMatch[1] });
    sendJson(res, 202, result);
    return true;
  }

  return false;
}
