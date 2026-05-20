const DISABLED_MESSAGE = "Vendor credential backend is disabled.";
const MOCK_MESSAGE = "Credential encryption store is not implemented in this skeleton.";

function sanitizeStatus(status = {}) {
  return {
    vendorId: String(status.vendorId || ""),
    connected: Boolean(status.connected),
    stored: Boolean(status.stored),
    mode: status.mode || "disabled",
    savedAt: status.savedAt || null,
    message: status.message || DISABLED_MESSAGE,
  };
}

function hasCredentialStore(credentialStore) {
  return credentialStore
    && typeof credentialStore.status === "function"
    && typeof credentialStore.upsert === "function";
}

export function createVendorCredentialService({ authService, internalAdminToken = "", credentialStore = null }) {
  const encryptedStoreReady = hasCredentialStore(credentialStore);
  const internalAccess = authService || {
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
  };

  return {
    isEnabled() {
      return Boolean(internalAdminToken && encryptedStoreReady);
    },

    assertInternalAccess(req) {
      try {
        internalAccess.assertInternalAccess(req);
      } catch (error) {
        if (error.message === "internal_auth_not_configured") {
          error.message = "vendor_credentials_backend_disabled";
        }
        throw error;
      }
      if (!encryptedStoreReady) {
        return;
      }
    },

    async status({ vendorId }) {
      if (!internalAdminToken) {
        return sanitizeStatus({
          vendorId,
          connected: false,
          stored: false,
          mode: "disabled",
          message: DISABLED_MESSAGE,
        });
      }

      if (!encryptedStoreReady) {
        return sanitizeStatus({
          vendorId,
          connected: false,
          stored: false,
          mode: "mock",
          message: MOCK_MESSAGE,
        });
      }

      return sanitizeStatus(await credentialStore.status({ vendorId }));
    },

    async upsert({ vendorId, credentials }) {
      if (!encryptedStoreReady) {
        return sanitizeStatus({
          vendorId,
          connected: false,
          stored: false,
          mode: "mock",
          message: MOCK_MESSAGE,
        });
      }

      return sanitizeStatus(await credentialStore.upsert({
        vendorId,
        username: credentials.username,
        password: credentials.password,
      }));
    },
  };
}
