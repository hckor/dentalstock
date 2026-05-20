import { appRepository } from "../repositories/appRepository";

const DEFAULTS = {
  vendors: [
    { id: 1, name: "덴올", connected: true, username: "", password: "", automaticOrdering: true },
    { id: 2, name: "오스템몰", connected: true, username: "", password: "", automaticOrdering: true },
    { id: 3, name: "이덴트", connected: false, username: "", password: "", automaticOrdering: false },
  ],
  preferredVendor: "1",
  maxOrderAmount: "50000",
};

function normalizeSettings(saved) {
  const savedVendors = Array.isArray(saved?.vendors) ? saved.vendors : [];
  const vendors = DEFAULTS.vendors.map(defaultVendor => {
    const savedVendor = savedVendors.find(vendor => String(vendor.id) === String(defaultVendor.id)) || {};
    return { ...defaultVendor, ...savedVendor };
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
    return normalizeSettings(saved);
  },
  save(settings) {
    appRepository.settings.set(settings);
  },
};
