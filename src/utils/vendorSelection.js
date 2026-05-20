export const LOWEST_VENDOR_VALUE = "lowest";

const normalizeVendorId = (value) => String(value || "");
const toPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

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
  return resolveOrderVendorForQty(item, settings, 1);
}

export function getEffectiveVendorPrice(option, orderQty = 1) {
  const itemPrice = toPositiveNumber(option?.price);
  if (!itemPrice) return null;
  const qty = Math.max(1, Number(orderQty) || 1);
  const minOrderQty = Math.max(1, Number(option?.min_order_qty) || 1);
  const purchasableQty = Math.max(qty, minOrderQty);
  const shippingFee = toPositiveNumber(option?.shipping_fee) || 0;
  return Math.round(itemPrice + (shippingFee / purchasableQty));
}

export function getVendorPriceCandidates(item, orderQty = 1) {
  const vendorOptions = Array.isArray(item?.vendor_options) ? item.vendor_options : [];
  return vendorOptions
    .map(option => ({
      vendor_id: normalizeVendorId(option.vendor_id),
      vendor_name: option.vendor_name || `거래처 ${option.vendor_id || ""}`.trim(),
      vendor_price: getEffectiveVendorPrice(option, orderQty),
      vendor_base_price: toPositiveNumber(option.price),
      vendor_shipping_fee: toPositiveNumber(option.shipping_fee) || 0,
      vendor_min_order_qty: Math.max(1, Number(option.min_order_qty) || 1),
      vendor_sku: option.sku || "",
      vendor_url: option.url || "",
      vendor_in_stock: option.in_stock !== false,
      vendor_last_checked_at: option.last_checked_at || null,
    }))
    .sort((a, b) => {
      if (a.vendor_in_stock !== b.vendor_in_stock) return a.vendor_in_stock ? -1 : 1;
      const aPrice = Number.isFinite(a.vendor_price) ? a.vendor_price : Number.POSITIVE_INFINITY;
      const bPrice = Number.isFinite(b.vendor_price) ? b.vendor_price : Number.POSITIVE_INFINITY;
      return aPrice - bPrice;
    });
}

export function resolveOrderVendorForQty(item, settings, orderQty = 1) {
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
        vendor_price: getEffectiveVendorPrice(option, orderQty),
        vendor_base_price: toPositiveNumber(option.price),
        vendor_shipping_fee: toPositiveNumber(option.shipping_fee) || 0,
        vendor_min_order_qty: Math.max(1, Number(option.min_order_qty) || 1),
        vendor_sku: option.sku || "",
        vendor_url: option.url || "",
        vendor_in_stock: option.in_stock !== false,
        vendor_last_checked_at: option.last_checked_at || null,
      };
    });

  const selectedOption = preferredVendor && preferredVendor !== LOWEST_VENDOR_VALUE
    ? candidateOptions.find(option => option.vendor_id === preferredVendor)
    : null;
  const lowestOption = candidateOptions
    .filter(option => option.vendor_in_stock && Number.isFinite(option.vendor_price) && option.vendor_price > 0)
    .sort((a, b) => a.vendor_price - b.vendor_price)[0];
  const option = selectedOption || lowestOption || candidateOptions[0];

  if (option) {
    return {
      vendor_id: option.vendor_id,
      vendor_name: option.vendor_name,
      vendor_price: option.vendor_price,
      vendor_base_price: option.vendor_base_price,
      vendor_shipping_fee: option.vendor_shipping_fee,
      vendor_min_order_qty: option.vendor_min_order_qty,
      vendor_sku: option.vendor_sku,
      vendor_url: option.vendor_url,
      vendor_in_stock: option.vendor_in_stock,
      vendor_last_checked_at: option.vendor_last_checked_at,
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
