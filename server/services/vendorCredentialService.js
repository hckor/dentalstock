export function createVendorCredentialService({ internalAdminToken }) {
  return {
    isEnabled() {
      return Boolean(internalAdminToken);
    },

    assertInternalAccess(req) {
      if (!internalAdminToken) {
        const error = new Error("vendor_credentials_backend_disabled");
        error.statusCode = 503;
        throw error;
      }
      if (req.headers["x-internal-admin-token"] !== internalAdminToken) {
        const error = new Error("forbidden");
        error.statusCode = 403;
        throw error;
      }
    },

    async status({ vendorId }) {
      return {
        vendorId,
        connected: false,
        mode: internalAdminToken ? "ready" : "disabled",
      };
    },

    async upsert({ vendorId }) {
      return {
        vendorId,
        stored: false,
        message: "Credential encryption store is not implemented in this skeleton.",
      };
    },
  };
}
