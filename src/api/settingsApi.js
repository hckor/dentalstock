import { appRepository } from "../repositories/appRepository";

const DEFAULTS = {
  vendors: [
    { id: 1, name: "덴올", connected: true, automaticOrdering: true },
    { id: 2, name: "오스템몰", connected: true, automaticOrdering: true },
    { id: 3, name: "이덴트", connected: false, automaticOrdering: false },
  ],
  preferredVendor: "1",
  maxOrderAmount: "50000",
};

function stripCredentialFields(vendor = {}) {
  const safeVendor = { ...vendor };
  delete safeVendor.username;
  delete safeVendor.password;
  return safeVendor;
}

function sanitizeSettings(settings = {}) {
  const source = settings || {};
  const vendors = Array.isArray(source.vendors)
    ? source.vendors.map(stripCredentialFields)
    : DEFAULTS.vendors;

  return {
    ...source,
    vendors,
  };
}

function migrateLegacyCredentials(saved) {
  const savedVendors = Array.isArray(saved?.vendors) ? saved.vendors : [];
  const legacyCredentials = savedVendors.reduce((acc, vendor) => {
    const username = String(vendor.username || "");
    const password = String(vendor.password || "");
    if (!username && !password) return acc;
    acc[String(vendor.id)] = { username, password };
    return acc;
  }, {});

  if (!Object.keys(legacyCredentials).length) return false;

  appRepository.vendorCredentials.set({
    ...(appRepository.vendorCredentials.get() || {}),
    ...legacyCredentials,
  });
  return true;
}

function normalizeSettings(saved) {
  const savedVendors = Array.isArray(saved?.vendors) ? saved.vendors : [];
  const vendors = DEFAULTS.vendors.map(defaultVendor => {
    const savedVendor = savedVendors.find(vendor => String(vendor.id) === String(defaultVendor.id)) || {};
    return { ...defaultVendor, ...stripCredentialFields(savedVendor) };
  });

  const vendorIds = vendors.map(vendor => String(vendor.id));
  const preferredVendor = vendorIds.includes(String(saved?.preferredVendor))
    ? String(saved.preferredVendor)
    : DEFAULTS.preferredVendor;

  return {
    ...DEFAULTS,
    ...(saved || {}),
    vendors,
    preferredVendor,
    maxOrderAmount: String(saved?.maxOrderAmount ?? DEFAULTS.maxOrderAmount),
  };
}

export const settingsApi = {
  load() {
    const saved = appRepository.settings.get();
    const migrated = migrateLegacyCredentials(saved);
    const safeSettings = sanitizeSettings(saved);
    if (migrated) appRepository.settings.set(safeSettings);
    return normalizeSettings(safeSettings);
  },
  save(settings) {
    const safeSettings = sanitizeSettings(settings);
    appRepository.settings.set(safeSettings);
    return normalizeSettings(safeSettings);
  },
};
