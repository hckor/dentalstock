import { T } from "../../../constants/colors";
import { formatMoney, toNumber } from "../../../utils/money";
import { getEffectiveVendorPrice, resolveOrderVendorForQty } from "../../../utils/vendorSelection";

export const MIN_ORDER_AMOUNT = 1000;
export const DEFAULT_MONTHLY_ORDER_LIMIT = "300000";
export const PRICE_STALE_DAYS = 14;

export const sectionTitleStyle = {
  margin: "0 0 12px",
  fontSize: 16,
  fontWeight: 600,
  color: T.grey600,
};

export const helperTextStyle = {
  margin: "8px 0 0",
  fontSize: 14,
  color: T.grey500,
  lineHeight: 1.45,
};

export const panelGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: 8,
};

export const inputLabelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 16,
  fontWeight: 600,
  color: T.grey700,
};

export const currencySuffixStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: T.grey600,
  flexShrink: 0,
};

export function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function moneyInput(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

export function formatCurrency(value) {
  const number = toNumber(value);
  if (number <= 0) return "미설정";
  return formatMoney(number);
}

export function formatDateTime(value) {
  if (!value) return "확인 전";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "확인 전";
  return parsed.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function resolveMonthlyOrderLimit(settings) {
  return String(settings?.monthlyOrderLimit ?? settings?.monthlyBudgetAmount ?? settings?.monthlyLimit ?? DEFAULT_MONTHLY_ORDER_LIMIT);
}

export function buildMonitorSummary({ items, vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit }) {
  const settings = { vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit };
  const monitoredItems = items.filter(item => Array.isArray(item.vendor_options) && item.vendor_options.length > 0);
  const lowStockRecommendations = monitoredItems
    .filter(item => item.current_qty < item.min_qty)
    .map(item => ({
      item,
      qty: Math.max(1, item.min_qty - item.current_qty),
      vendor: resolveOrderVendorForQty(item, settings, Math.max(1, item.min_qty - item.current_qty)),
    }))
    .filter(row => row.vendor.vendor_selection !== "unassigned")
    .slice(0, 5);

  return {
    monitoredCount: monitoredItems.length,
    candidateCount: monitoredItems.reduce((sum, item) => sum + item.vendor_options.length, 0),
    lowStockRecommendations,
  };
}

export function buildPolicySummary({ vendors, items, credentialStatuses, preferredVendor, priceReferenceTime }) {
  const staleThreshold = PRICE_STALE_DAYS * 24 * 60 * 60 * 1000;
  const vendorStats = new Map(vendors.map(vendor => [String(vendor.id), createVendorStat(vendor)]));
  let latestCheckedAt = null;
  let uncheckedCount = 0;
  let staleCount = 0;

  items.forEach(item => {
    const options = Array.isArray(item.vendor_options) ? item.vendor_options : [];
    const purchasableQty = Math.max(1, Number(item.min_qty || 1) - Number(item.current_qty || 0));
    const lowestOption = options
      .filter(option => option.in_stock !== false && getEffectiveVendorPrice(option, purchasableQty))
      .sort((a, b) => getEffectiveVendorPrice(a, purchasableQty) - getEffectiveVendorPrice(b, purchasableQty))[0];

    options.forEach(option => {
      const vendorId = String(option.vendor_id || "");
      const stat = vendorStats.get(vendorId) || createVendorStat({ id: vendorId, name: option.vendor_name || `거래처 ${vendorId}` });
      const checkedAt = option.last_checked_at ? new Date(option.last_checked_at) : null;
      const checkedTime = checkedAt && !Number.isNaN(checkedAt.getTime()) ? checkedAt.getTime() : null;
      const shippingFee = toPositiveNumber(option.shipping_fee);
      const minOrderQty = Math.max(1, Number(option.min_order_qty) || 1);

      stat.optionCount += 1;
      stat.urlCount += option.url ? 1 : 0;
      stat.inStockCount += option.in_stock === false ? 0 : 1;
      stat.pricedCount += toPositiveNumber(option.price) ? 1 : 0;
      stat.maxMinOrderQty = Math.max(stat.maxMinOrderQty, minOrderQty);
      if (shippingFee) {
        stat.shippingTotal += shippingFee;
        stat.shippingCount += 1;
      }
      if (checkedTime) {
        stat.latestCheckedAt = !stat.latestCheckedAt || checkedTime > new Date(stat.latestCheckedAt).getTime()
          ? option.last_checked_at
          : stat.latestCheckedAt;
        latestCheckedAt = !latestCheckedAt || checkedTime > new Date(latestCheckedAt).getTime()
          ? option.last_checked_at
          : latestCheckedAt;
        if (priceReferenceTime - checkedTime > staleThreshold) {
          stat.staleCount += 1;
          staleCount += 1;
        }
      } else {
        stat.uncheckedCount += 1;
        uncheckedCount += 1;
      }
      if (lowestOption && String(lowestOption.vendor_id) === vendorId) stat.lowestWins += 1;
      vendorStats.set(vendorId, stat);
    });
  });

  const connectedCount = vendors.filter(vendor => credentialStatuses[String(vendor.id)]?.connected).length;
  const automaticCount = vendors.filter(vendor => vendor.automaticOrdering !== false).length;
  const preferredVendorName = preferredVendor === "lowest"
    ? "최저가 자동 선택"
    : vendors.find(vendor => String(vendor.id) === String(preferredVendor))?.name || "거래처 미정";

  return {
    connectedCount,
    automaticCount,
    preferredVendorName,
    latestCheckedAt,
    uncheckedCount,
    staleCount,
    vendorStats: Array.from(vendorStats.values()),
  };
}

function createVendorStat(vendor) {
  return {
    id: String(vendor.id),
    name: vendor.name,
    optionCount: 0,
    urlCount: 0,
    inStockCount: 0,
    pricedCount: 0,
    uncheckedCount: 0,
    staleCount: 0,
    lowestWins: 0,
    shippingTotal: 0,
    shippingCount: 0,
    maxMinOrderQty: 1,
    latestCheckedAt: null,
  };
}
