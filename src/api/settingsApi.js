import { appRepository } from "../repositories/appRepository";

const DEFAULTS = {
  vendors: [
    { id: 1, name: "덴올", connected: false, automaticOrdering: true },
    { id: 2, name: "오스템몰", connected: false, automaticOrdering: true },
    { id: 3, name: "이덴트", connected: false, automaticOrdering: false },
  ],
  preferredVendor: "lowest",
  maxOrderAmount: "50000",
};

function stripCredentialFields(vendor = {}) {
  const safeVendor = { ...vendor };
  delete safeVendor.username;
  delete safeVendor.password;
  delete safeVendor.connected;
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

function hasServerOwnedVendorFields(saved) {
  const savedVendors = Array.isArray(saved?.vendors) ? saved.vendors : [];
  return savedVendors.some(vendor => (
    vendor.username || vendor.password || Object.hasOwn(vendor, "connected")
  ));
}

function normalizeSettings(saved) {
  const savedVendors = Array.isArray(saved?.vendors) ? saved.vendors : [];
  const vendors = DEFAULTS.vendors.map(defaultVendor => {
    const savedVendor = savedVendors.find(vendor => String(vendor.id) === String(defaultVendor.id)) || {};
    return { ...defaultVendor, ...stripCredentialFields(savedVendor) };
  });

  const vendorIds = vendors.map(vendor => String(vendor.id));
  const preferredVendor = String(saved?.preferredVendor) === "lowest" || vendorIds.includes(String(saved?.preferredVendor))
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
  normalize(settings) {
    return normalizeSettings(sanitizeSettings(settings));
  },
  load() {
    const saved = appRepository.settings.get();
    const hadServerOwnedVendorFields = hasServerOwnedVendorFields(saved);
    const safeSettings = sanitizeSettings(saved);
    if (hadServerOwnedVendorFields) appRepository.settings.set(safeSettings);
    return normalizeSettings(safeSettings);
  },
  set(settings) {
    const safeSettings = sanitizeSettings(settings);
    appRepository.settings.set(safeSettings);
    return normalizeSettings(safeSettings);
  },
  save(settings) {
    return this.set(settings);
  },
};
