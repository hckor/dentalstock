import { compactMoney } from "./money";
import { getVendorPriceCandidates } from "./vendorSelection";

export const SINGLE_ORDER_OWNER_REVIEW_AMOUNT = 100000;
export const MONTHLY_OWNER_REVIEW_AMOUNT = 500000;

export function getOrderUnitPrice(order, item) {
  if (Number.isFinite(Number(order?.vendor_price))) return Number(order.vendor_price);
  const candidate = getVendorPriceCandidates(item, order?.qty).find(row => Number.isFinite(Number(row.vendor_price)));
  if (candidate) return Number(candidate.vendor_price);
  return Number(item?.price) || 0;
}

export function getOrderAmount(order, item) {
  return getOrderUnitPrice(order, item) * (Number(order?.qty) || 0);
}

export function getOrderMonthKey(order) {
  const source = order?.requested_at || order?.reviewed_at || order?.received_at || "";
  return String(source).slice(0, 7) || "unknown";
}

export function getMonthlyProjectedAmounts(orders, allItems) {
  const itemMap = new Map(allItems.map(item => [item.id, item]));
  const amountByMonth = new Map();

  orders
    .filter(order => order.status !== "rejected")
    .forEach(order => {
      const item = itemMap.get(order.item_id);
      if (!item) return;
      const monthKey = getOrderMonthKey(order);
      amountByMonth.set(monthKey, (amountByMonth.get(monthKey) || 0) + getOrderAmount(order, item));
    });

  return Object.fromEntries(orders.map(order => [order.id, amountByMonth.get(getOrderMonthKey(order)) || 0]));
}

export function getOrderApprovalGate(
  order,
  item,
  duplicateInfo,
  monthlyProjectedAmount = 0,
  {
    singleOrderOwnerReviewAmount = SINGLE_ORDER_OWNER_REVIEW_AMOUNT,
    monthlyOwnerReviewAmount = MONTHLY_OWNER_REVIEW_AMOUNT,
  } = {}
) {
  const candidates = getVendorPriceCandidates(item, order?.qty);
  const amount = getOrderAmount(order, item);
  const reasons = [];

  if (amount >= singleOrderOwnerReviewAmount) reasons.push(`1회 ${compactMoney(singleOrderOwnerReviewAmount)} 이상`);
  if (!candidates.length) reasons.push("가격 후보 없음");
  if (duplicateInfo?.hasDuplicate) reasons.push("중복 발주");
  if (Number(monthlyProjectedAmount) >= monthlyOwnerReviewAmount) reasons.push(`월 ${compactMoney(monthlyOwnerReviewAmount)} 초과 가능`);

  return {
    requiresOwnerApproval: reasons.length > 0,
    reasons,
  };
}

export function sumOrderQty(orders) {
  return orders.reduce((sum, order) => sum + (Number(order?.qty) || 0), 0);
}

export function getOrderDuplicateInfo(order, allOrders) {
  const sameItemOrders = allOrders.filter(target => target.item_id === order.item_id && target.id !== order.id);
  const pendingOrders = sameItemOrders.filter(target => target.status === "pending");
  const orderedOrders = sameItemOrders.filter(target => target.status === "ordered");

  return {
    pendingCount: pendingOrders.length,
    pendingQty: sumOrderQty(pendingOrders),
    orderedCount: orderedOrders.length,
    orderedQty: sumOrderQty(orderedOrders),
    hasDuplicate: pendingOrders.length > 0 || orderedOrders.length > 0,
  };
}

export function getDuplicatePendingCount(orders, duplicateInfoByOrderId) {
  return orders.filter(order => duplicateInfoByOrderId[order.id]?.hasDuplicate).length;
}

export function getPendingSummary(orders, allItems) {
  return orders.reduce((summary, order) => {
    const item = allItems.find(target => target.id === order.item_id);
    if (!item) return summary;
    const unitPrice = getOrderUnitPrice(order, item);
    summary.amount += unitPrice * (Number(order.qty) || 0);
    if (Number(item.current_qty) < Number(item.min_qty)) summary.stockRisk += 1;

    const candidates = getVendorPriceCandidates(item, order.qty);
    const prices = candidates.map(candidate => Number(candidate.vendor_price)).filter(price => Number.isFinite(price) && price > 0);
    if (prices.length > 1) {
      summary.savings += (Math.max(...prices) - Math.min(...prices)) * (Number(order.qty) || 0);
    }
    return summary;
  }, { amount: 0, stockRisk: 0, savings: 0 });
}
