import { T } from "../../../constants/colors";
import { CATEGORIES } from "../../../constants/categories";
import { itemUnitPrice, orderAmount, toNumber } from "../../../utils/money";

export const ALL_CATS = [{ id: 0, name: "전체", color: T.grey700 }, ...CATEGORIES];

const DAY = 86400000;

export const inventoryTone = {
  low: { color: T.warning, bg: T.warningBg },
  expiry: { color: T.danger, bg: T.dangerBg },
  overstock: { color: T.hold, bg: T.holdBg },
  ok: { color: T.success, bg: T.successBg },
};

export const daysUntilExpiry = (value, today) => {
  if (!value) return null;
  const expiry = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(expiry.getTime()) || Number.isNaN(base.getTime())) return null;
  return Math.ceil((expiry.getTime() - base.getTime()) / DAY);
};

export const isOverstocked = (item) => {
  const minQty = Number(item.min_qty) || 0;
  const currentQty = Number(item.current_qty) || 0;
  return currentQty > Math.max(minQty * 2, minQty + 3);
};

export const storageKeyForRole = (role) => `dentalstock.inventoryRisk.${role || "guest"}`;

export const loadSavedRisk = (role) => {
  if (typeof window === "undefined") return "all";
  try {
    return window.localStorage.getItem(storageKeyForRole(role)) || "all";
  } catch {
    return "all";
  }
};

export function buildInventoryRiskRows({ items, orderedItemIds, incomingByItem, stockToday }) {
  return items.map(item => {
    const currentQty = Number(item.current_qty) || 0;
    const minQty = Number(item.min_qty) || 0;
    const expiryDays = daysUntilExpiry(item.expiry, stockToday);
    const low = currentQty < minQty;
    const out = currentQty <= 0;
    const overstock = isOverstocked(item);
    const expirySoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 60;
    const incoming = orderedItemIds.has(item.id);
    const priority = (out ? 5 : 0) + (low ? 4 : 0) + (expirySoon ? Math.max(1, 4 - Math.floor(expiryDays / 15)) : 0) + (overstock ? 1 : 0);
    const statusText = out
      ? "품절"
      : low
        ? `부족 ${Math.max(1, minQty - currentQty)}${item.unit}`
        : expirySoon
          ? `${expiryDays}일 후 만료`
          : overstock
            ? `과잉 ${currentQty - minQty}${item.unit}`
            : incoming
              ? "입고 대기"
              : "정상";
    const unitPrice = itemUnitPrice(item);
    const shortageQty = low ? Math.max(1, minQty - currentQty) : 0;
    const overstockQty = overstock ? Math.max(0, currentQty - minQty) : 0;
    const incomingMeta = incomingByItem.get(item.id) || { qty: 0, amount: 0 };
    const shortageAmount = shortageQty * unitPrice;
    const expiryRiskAmount = expirySoon ? currentQty * unitPrice : 0;
    const overstockAmount = overstockQty * unitPrice;
    const businessRiskAmount = shortageAmount + expiryRiskAmount + overstockAmount + incomingMeta.amount;
    return {
      item,
      low,
      out,
      overstock,
      expirySoon,
      incoming,
      priority,
      statusText,
      unitPrice,
      expiryDays,
      shortageQty,
      overstockQty,
      incomingQty: incomingMeta.qty,
      incomingAmount: incomingMeta.amount,
      shortageAmount,
      expiryRiskAmount,
      overstockAmount,
      businessRiskAmount,
    };
  });
}

export function buildIncomingByItem({ orderedOrders, itemMap }) {
  return orderedOrders.reduce((map, order) => {
    const item = itemMap.get(order.item_id);
    const prev = map.get(order.item_id) || { qty: 0, amount: 0 };
    map.set(order.item_id, {
      qty: prev.qty + toNumber(order.qty),
      amount: prev.amount + orderAmount(order, item),
    });
    return map;
  }, new Map());
}

export function buildOwnerCostSummary({ riskRows, orderedOrders, itemMap }) {
  const shortageAmount = riskRows.reduce((sum, row) => sum + row.shortageAmount, 0);
  const expiryRiskAmount = riskRows.reduce((sum, row) => sum + row.expiryRiskAmount, 0);
  const overstockAmount = riskRows.reduce((sum, row) => sum + row.overstockAmount, 0);
  const incomingAmount = orderedOrders.reduce((sum, order) => sum + orderAmount(order, itemMap.get(order.item_id)), 0);
  return { shortageAmount, expiryRiskAmount, overstockAmount, incomingAmount };
}
