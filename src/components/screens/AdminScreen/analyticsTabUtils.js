import { CATEGORIES } from "../../../constants/categories";
import { compactMoney, highestVendorPrice, itemUnitPrice, orderUnitPrice, toNumber } from "../../../utils/money";

export const PERIODS = [
  { id: "current", label: "이번 달" },
  { id: "prev", label: "지난 달" },
  { id: "3months", label: "3개월" },
];

const DAY = 86400000;

function getPeriodRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  return { start, end: now };
}

function getPrevRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
  return { start, end };
}

function isInRange(value, range) {
  const date = value ? new Date(value) : null;
  return date && date >= range.start && date <= range.end;
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / DAY);
}

function usageRowsForRange(txs, items, range) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const usage = new Map();
  txs
    .filter(tx => tx.type === "out" && isInRange(tx.created_at, range))
    .forEach(tx => {
      const item = itemMap.get(tx.item_id);
      const prev = usage.get(tx.item_id) || { item, qty: 0, amount: 0 };
      const qty = toNumber(tx.qty);
      prev.qty += qty;
      prev.amount += qty * itemUnitPrice(item);
      usage.set(tx.item_id, prev);
    });
  return Array.from(usage.values()).filter(row => row.item);
}

function orderRowsForRange(orders, items, range) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const orderRows = new Map();
  orders
    .filter(order => ["ordered", "received"].includes(order.status) && isInRange(order.reviewed_at || order.requested_at, range))
    .forEach(order => {
      const item = itemMap.get(order.item_id);
      if (!item) return;
      const prev = orderRows.get(order.item_id) || { item, qty: 0, amount: 0, count: 0 };
      const qty = toNumber(order.qty);
      prev.qty += qty;
      prev.amount += orderUnitPrice(order, item) * qty;
      prev.count += 1;
      orderRows.set(order.item_id, prev);
    });
  return Array.from(orderRows.values());
}

function orderAmount(order, itemMap) {
  const item = itemMap.get(order.item_id);
  return orderUnitPrice(order, item) * toNumber(order.qty);
}

export function buildAnalyticsData({ items, txs, orders, period }) {
  const range = getPeriodRange(period);
  const prevRange = getPrevRange(period);
  const itemMap = new Map(items.map(item => [item.id, item]));
  const periodUsageRows = usageRowsForRange(txs, items, range);
  const prevUsageRows = usageRowsForRange(txs, items, prevRange);
  const periodOrderRows = orderRowsForRange(orders, items, range);
  const prevOrderRows = orderRowsForRange(orders, items, prevRange);
  const prevByItem = new Map(prevUsageRows.map(row => [row.item.id, row]));
  const prevOrdersByItem = new Map(prevOrderRows.map(row => [row.item.id, row]));
  const periodOrders = orders.filter(order => ["ordered", "received"].includes(order.status) && isInRange(order.reviewed_at || order.requested_at, range));
  const pendingOrders = orders.filter(order => order.status === "pending");

  const usageCost = periodUsageRows.reduce((sum, row) => sum + row.amount, 0);
  const previousUsageCost = prevUsageRows.reduce((sum, row) => sum + row.amount, 0);
  const pendingAmount = pendingOrders.reduce((sum, order) => sum + orderAmount(order, itemMap), 0);
  const purchaseAmount = periodOrders.reduce((sum, order) => sum + orderAmount(order, itemMap), 0);
  const estimatedSavings = periodOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    const high = highestVendorPrice(item);
    const selected = orderUnitPrice(order, item);
    return sum + Math.max(0, high - selected) * toNumber(order.qty);
  }, 0);

  const drivers = periodUsageRows
    .map(row => {
      const previous = prevByItem.get(row.item.id) || { qty: 0, amount: 0 };
      return {
        key: row.item.id,
        item: row.item,
        qty: row.qty,
        previousQty: previous.qty,
        amount: row.amount,
        deltaAmount: row.amount - previous.amount,
        deltaQty: row.qty - previous.qty,
      };
    })
    .sort((a, b) => b.deltaAmount - a.deltaAmount);

  const wasteRows = items
    .map(item => {
      const unitPrice = itemUnitPrice(item);
      const expiryDays = daysUntil(item.expiry);
      const expiryRisk = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;
      const recentUsed = txs
        .filter(tx => tx.type === "out" && tx.item_id === item.id && isInRange(tx.created_at, getPeriodRange("3months")))
        .reduce((sum, tx) => sum + toNumber(tx.qty), 0);
      const overstockQty = Math.max(0, toNumber(item.current_qty) - Math.max(toNumber(item.min_qty) * 2, toNumber(item.min_qty) + 3));
      const staleRisk = !expiryRisk && overstockQty > 0 && recentUsed === 0;
      const riskQty = expiryRisk ? toNumber(item.current_qty) : overstockQty;
      return {
        key: item.id,
        item,
        reason: expiryRisk ? `${expiryDays}일 내 유통기한` : "최근 사용 없는 과잉재고",
        riskAmount: riskQty * unitPrice,
        riskQty,
        expiryRisk,
        staleRisk,
      };
    })
    .filter(row => (row.expiryRisk || row.staleRisk) && row.riskAmount > 0)
    .sort((a, b) => b.riskAmount - a.riskAmount);

  const vendorMap = new Map();
  periodOrders.forEach(order => {
    const vendorName = order.vendor_name || "거래처 미정";
    const prev = vendorMap.get(vendorName) || { key: vendorName, name: vendorName, count: 0, amount: 0 };
    prev.count += 1;
    prev.amount += orderAmount(order, itemMap);
    vendorMap.set(vendorName, prev);
  });
  const vendorRows = Array.from(vendorMap.values()).sort((a, b) => b.amount - a.amount);

  const categoryRows = CATEGORIES.map(category => {
    const categoryItemIds = new Set(items.filter(item => item.category_id === category.id).map(item => item.id));
    const amount = periodUsageRows
      .filter(row => categoryItemIds.has(row.item.id))
      .reduce((sum, row) => sum + row.amount, 0);
    const previousAmount = prevUsageRows
      .filter(row => categoryItemIds.has(row.item.id))
      .reduce((sum, row) => sum + row.amount, 0);
    return { ...category, amount, previousAmount, deltaAmount: amount - previousAmount };
  }).filter(row => row.amount > 0);

  const orderCauses = periodOrderRows
    .map(row => {
      const previous = prevOrdersByItem.get(row.item.id) || { amount: 0, qty: 0, count: 0 };
      return {
        key: `order-${row.item.id}`,
        type: "order",
        title: `${row.item.name} 발주 증가`,
        amount: row.amount - previous.amount,
        reason: `발주 ${row.count}건 · 이전보다 ${Math.max(0, row.qty - previous.qty)}${row.item.unit} 증가`,
        nextAction: "승인 내역과 현재 재고가 겹치지 않는지 확인",
      };
    })
    .filter(row => row.amount > 0);
  const usageCauses = drivers
    .filter(row => row.deltaAmount > 0)
    .map(row => ({
      key: `usage-${row.item.id}`,
      type: "usage",
      title: `${row.item.name} 사용 증가`,
      amount: row.deltaAmount,
      reason: `출고가 이전보다 ${row.deltaQty}${row.item.unit} 늘어남`,
      nextAction: "수술 사용량 또는 반복 출고 패턴 확인",
    }));
  const wasteCauses = wasteRows.map(row => ({
    key: `waste-${row.item.id}`,
    type: "waste",
    title: `${row.item.name} 낭비 위험`,
    amount: row.riskAmount,
    reason: `${row.reason} · ${row.riskQty}${row.item.unit} 영향`,
    nextAction: row.expiryRisk ? "우선 사용 또는 폐기 판단" : "보충 중단과 최소재고 기준 재검토",
  }));
  const categoryCauses = categoryRows
    .filter(row => row.deltaAmount > 0)
    .map(row => ({
      key: `category-${row.id}`,
      type: "category",
      title: `${row.name} 카테고리 증가`,
      amount: row.deltaAmount,
      reason: `카테고리 사용액이 이전 기간보다 ${compactMoney(row.deltaAmount)} 증가`,
      nextAction: "상위 사용 품목과 수술 스케줄을 함께 확인",
    }));
  const topCauses = [...orderCauses, ...usageCauses, ...wasteCauses, ...categoryCauses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    usageCost,
    previousUsageCost,
    pendingAmount,
    purchaseAmount,
    estimatedSavings,
    wasteRiskAmount: wasteRows.reduce((sum, row) => sum + row.riskAmount, 0),
    drivers,
    topDriver: drivers.find(row => row.deltaAmount > 0),
    wasteRows,
    vendorRows,
    categoryRows,
    topCauses,
  };
}
