import { getApiConfig } from "../config/apiMode";

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "remote_request_failed");
    error.statusCode = response.status;
    throw error;
  }
  return body;
}

export function createRemoteRepositoryClient(config = getApiConfig()) {
  const request = async (path, options = {}) => {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        "x-clinic-id": "demo-clinic",
        ...(options.headers || {}),
      },
    });
    return parseResponse(response);
  };

  return {
    health() {
      return request("/health", { method: "GET" });
    },
    listOrders() {
      return request("/api/orders", { method: "GET" });
    },
    refreshTracking({ carrier, trackingNumber, currentStatuses = [] }) {
      return request("/api/tracking/refresh", {
        method: "POST",
        body: JSON.stringify({ carrier, trackingNumber, currentStatuses }),
      });
    },
    vendorCredentialStatus(vendorId) {
      return request(`/api/vendor-credentials/${vendorId}/status`, { method: "GET" });
    },
    saveVendorCredential(vendorId, credentials) {
      return request(`/api/vendor-credentials/${vendorId}`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
  };
}

export const remoteRepository = createRemoteRepositoryClient();
