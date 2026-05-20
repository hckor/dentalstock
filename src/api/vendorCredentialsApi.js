import { appRepository } from "../repositories/appRepository";

function normalizeCredentials(credentials = {}) {
  return {
    username: String(credentials.username || ""),
    password: String(credentials.password || ""),
  };
}

function normalizeCredentialsMap(credentialsByVendor = {}) {
  return Object.entries(credentialsByVendor || {}).reduce((acc, [vendorId, credentials]) => {
    acc[String(vendorId)] = normalizeCredentials(credentials);
    return acc;
  }, {});
}

export const vendorCredentialsApi = {
  loadAll() {
    return normalizeCredentialsMap(appRepository.vendorCredentials.get() || {});
  },

  saveAll(credentialsByVendor) {
    const safeCredentials = normalizeCredentialsMap(credentialsByVendor);
    appRepository.vendorCredentials.set(safeCredentials);
    return safeCredentials;
  },

  get(vendorId) {
    return this.loadAll()[String(vendorId)] || normalizeCredentials();
  },

  save(vendorId, credentials) {
    const next = {
      ...this.loadAll(),
      [String(vendorId)]: normalizeCredentials(credentials),
    };
    return this.saveAll(next);
  },

  remove(vendorId) {
    const next = { ...this.loadAll() };
    delete next[String(vendorId)];
    return this.saveAll(next);
  },
};
