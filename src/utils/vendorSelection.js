export const LOWEST_VENDOR_VALUE = "lowest";

const normalizeVendorId = (value) => String(value || "");

const getActiveVendors = (settings) => {
  const vendors = Array.isArray(settings?.vendors) ? settings.vendors : [];
  return vendors.filter(vendor => vendor.automaticOrdering !== false);
};

export function getVendorLabel(vendorSnapshot) {
  if (!vendorSnapshot) return "거래처 미정";
  if (vendorSnapshot.vendor_name || vendorSnapshot.name) return vendorSnapshot.vendor_name || vendorSnapshot.name;
  return vendorSnapshot.vendor_id ? `거래처 ${vendorSnapshot.vendor_id}` : "거래처 미정";
}

export function resolveOrderVendor(item, settings) {
  const activeVendors = getActiveVendors(settings);
  const fallbackVendor = activeVendors[0] || settings?.vendors?.[0] || null;
  const preferredVendor = normalizeVendorId(settings?.preferredVendor);
  const vendorOptions = Array.isArray(item?.vendor_options) ? item.vendor_options : [];
  const activeVendorIds = new Set(activeVendors.map(vendor => normalizeVendorId(vendor.id)));
  const candidateOptions = vendorOptions
    .filter(option => activeVendorIds.size === 0 || activeVendorIds.has(normalizeVendorId(option.vendor_id)))
    .map(option => {
      const vendor = settings?.vendors?.find(target => normalizeVendorId(target.id) === normalizeVendorId(option.vendor_id));
      return {
        vendor_id: normalizeVendorId(option.vendor_id),
        vendor_name: option.vendor_name || vendor?.name || `거래처 ${option.vendor_id}`,
        vendor_price: Number(option.price) || null,
        vendor_sku: option.sku || "",
      };
    });

  const selectedOption = preferredVendor && preferredVendor !== LOWEST_VENDOR_VALUE
    ? candidateOptions.find(option => option.vendor_id === preferredVendor)
    : null;
  const lowestOption = candidateOptions
    .filter(option => Number.isFinite(option.vendor_price) && option.vendor_price > 0)
    .sort((a, b) => a.vendor_price - b.vendor_price)[0];
  const option = selectedOption || lowestOption || candidateOptions[0];

  if (option) {
    return {
      vendor_id: option.vendor_id,
      vendor_name: option.vendor_name,
      vendor_price: option.vendor_price,
      vendor_sku: option.vendor_sku,
      vendor_selection: selectedOption ? "preferred" : lowestOption ? "lowest" : "available",
    };
  }

  if (!fallbackVendor) {
    return {
      vendor_id: "",
      vendor_name: "거래처 미정",
      vendor_price: null,
      vendor_sku: "",
      vendor_selection: "unassigned",
    };
  }

  return {
    vendor_id: normalizeVendorId(fallbackVendor.id),
    vendor_name: fallbackVendor.name,
    vendor_price: Number(item?.price) || null,
    vendor_sku: "",
    vendor_selection: "fallback",
  };
}

export function getOrderVendorKey(order) {
  return normalizeVendorId(order?.vendor_id) || "unassigned";
}
