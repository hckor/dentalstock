import { getStatus, todayKey } from "./helpers";
import { highestVendorPrice, itemUnitPrice, orderUnitPrice, toNumber } from "./money";
import {
  getMonthlyProjectedAmounts,
  getOrderApprovalGate,
  getOrderDuplicateInfo,
} from "./orderReview";
import { getShippingEvents } from "./shippingEvents";

const DAY = 86400000;
const EXPIRY_ATTENTION_DAYS = 60;

const toDate = (value) => value ? new Date(value) : null;

function dateRange(days, offsetDays = 0) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function isInRange(value, range) {
  const date = toDate(value);
  return date && date >= range.start && date <= range.end;
}

function addUsageByItem(txs, range) {
  const usage = new Map();
  txs
    .filter(tx => tx.type === "out" && (!range || isInRange(tx.created_at, range)))
    .forEach(tx => usage.set(tx.item_id, (usage.get(tx.item_id) || 0) + toNumber(tx.qty)));
  return usage;
}

function expectedItemCost(rows, itemMap) {
  return rows.reduce((sum, row) => {
    const item = itemMap.get(row.item_id);
    return sum + itemUnitPrice(item) * toNumber(row.qty);
  }, 0);
}

export function buildHomeDashboard({ items = [], txs = [], orders = [], surgeries = [] }) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const today = todayKey();
  const now = new Date();
  const currentMonth = { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  const previousMonth = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
  const recent30 = dateRange(30);
  const previous30 = dateRange(30, 30);

  const pendingOrders = orders.filter(order => order.status === "pending");
  const orderedOrders = orders.filter(order => order.status === "ordered");
  const receivedOrders = orders.filter(order => order.status === "received");
  const activeOrders = orders.filter(order => order.status === "pending" || order.status === "ordered");
  const monthlyProjectedAmountByOrderId = getMonthlyProjectedAmounts(orders, items);
  const ownerReviewOrders = orders.filter(order => {
    if (!["pending", "hold"].includes(order.status)) return false;
    if (order.status === "hold") return true;
    const item = itemMap.get(order.item_id);
    if (!item) return false;
    return getOrderApprovalGate(
      order,
      item,
      getOrderDuplicateInfo(order, orders),
      monthlyProjectedAmountByOrderId[order.id]
    ).requiresOwnerApproval;
  });
  const ownerReviewAmount = ownerReviewOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    return sum + orderUnitPrice(order, item) * toNumber(order.qty);
  }, 0);
  const deliveredOrders = orderedOrders.filter(order => getShippingEvents(order)[0]?.status === "배달완료");
  const waitingTrackingOrders = orderedOrders.filter(order => !order.tracking_number);
  const pendingWithPrice = pendingOrders.filter(order => {
    const item = itemMap.get(order.item_id);
    return Array.isArray(item?.vendor_options) && item.vendor_options.length > 0;
  });
  const pendingAmount = pendingOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    return sum + orderUnitPrice(order, item) * toNumber(order.qty);
  }, 0);

  const currentMonthOrders = orders.filter(order =>
    (order.status === "ordered" || order.status === "received") && isInRange(order.reviewed_at || order.requested_at, currentMonth)
  );
  const previousMonthOrders = orders.filter(order =>
    (order.status === "ordered" || order.status === "received") && isInRange(order.reviewed_at || order.requested_at, previousMonth)
  );

  const monthlySpend = currentMonthOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    return sum + orderUnitPrice(order, item) * toNumber(order.qty);
  }, 0);
  const previousMonthlySpend = previousMonthOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    return sum + orderUnitPrice(order, item) * toNumber(order.qty);
  }, 0);
  const estimatedSavings = currentMonthOrders.reduce((sum, order) => {
    const item = itemMap.get(order.item_id);
    const selected = orderUnitPrice(order, item);
    const high = highestVendorPrice(item);
    return sum + Math.max(0, high - selected) * toNumber(order.qty);
  }, 0);

  const expirySoon = items
    .filter(item => item.expiry)
    .map(item => {
      const daysLeft = Math.ceil((new Date(`${item.expiry}T00:00:00`) - new Date(`${today}T00:00:00`)) / DAY);
      return { ...item, daysLeft, riskCost: Math.max(0, toNumber(item.current_qty)) * itemUnitPrice(item) };
    })
    .filter(item => item.daysLeft >= 0 && item.daysLeft <= EXPIRY_ATTENTION_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const wasteRiskAmount = expirySoon.reduce((sum, item) => sum + item.riskCost, 0);
  const lowStockItems = items.filter(item => getStatus(item) === "warning");
  const outOfStockItems = items.filter(item => getStatus(item) === "danger");
  const temporaryItems = items.filter(item => item.isTemporary || item.needsReview || item.catalog_status === "temporary");
  const incomingItemIds = new Set(orderedOrders.map(order => order.item_id));
  const incomingItems = items.filter(item => incomingItemIds.has(item.id));
  const attentionItemIds = new Set([
    ...lowStockItems,
    ...outOfStockItems,
    ...expirySoon,
  ].map(item => item.id));

  const todayTxs = txs.filter(tx => String(tx.created_at || "").slice(0, 10) === today);
  const todayIn = todayTxs.filter(tx => tx.type === "in").reduce((sum, tx) => sum + toNumber(tx.qty), 0);
  const todayOut = todayTxs.filter(tx => tx.type === "out").reduce((sum, tx) => sum + toNumber(tx.qty), 0);

  const recentUsage = addUsageByItem(txs, recent30);
  const previousUsage = addUsageByItem(txs, previous30);
  const fastUsageItems = items
    .map(item => {
      const recent = recentUsage.get(item.id) || 0;
      const previous = previousUsage.get(item.id) || 0;
      return { ...item, recent, previous, delta: recent - previous };
    })
    .filter(item => item.recent >= 2 && item.delta > 0 && item.recent >= Math.max(2, item.previous * 1.4))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
  const slowUsageItems = items
    .map(item => ({ ...item, recent: recentUsage.get(item.id) || 0 }))
    .filter(item => item.current_qty > Math.max(item.min_qty * 2, item.min_qty + 3) && item.recent === 0)
    .sort((a, b) => (b.current_qty - b.min_qty) - (a.current_qty - a.min_qty))
    .slice(0, 5);

  const todaySurgeries = surgeries
    .filter(surgery => surgery.scheduled_date === today)
    .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));
  const todaySurgeryTodo = todaySurgeries.filter(surgery => !surgery.prep_confirmed || (surgery.prep_confirmed && !surgery.usage_confirmed));
  const weekEnd = new Date(`${today}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekSurgeries = surgeries.filter(surgery => {
    if (!surgery.scheduled_date) return false;
    const date = new Date(`${surgery.scheduled_date}T00:00:00`);
    return date >= new Date(`${today}T00:00:00`) && date <= weekEnd;
  });
  const surgeryPrepPending = surgeries.filter(surgery => surgery.scheduled_date >= today && !surgery.prep_confirmed);
  const surgeryUsagePending = surgeries.filter(surgery => surgery.prep_confirmed && !surgery.usage_confirmed);
  const highCostSurgeries = weekSurgeries
    .map(surgery => ({
      ...surgery,
      expectedCost: expectedItemCost(surgery.required_items || [], itemMap),
    }))
    .filter(surgery => surgery.expectedCost > 0)
    .sort((a, b) => b.expectedCost - a.expectedCost)
    .slice(0, 3);

  return {
    orders: {
      pending: pendingOrders,
      pendingAmount,
      pendingWithPrice,
      ordered: orderedOrders,
      received: receivedOrders,
      active: activeOrders,
      ownerReview: ownerReviewOrders,
      ownerReviewAmount,
      delivered: deliveredOrders,
      waitingTracking: waitingTrackingOrders,
    },
    inventory: {
      total: items.length,
      low: lowStockItems,
      out: outOfStockItems,
      expirySoon,
      temporary: temporaryItems,
      incoming: incomingItems,
      attentionCount: attentionItemIds.size,
    },
    cost: {
      monthlySpend,
      previousMonthlySpend,
      monthDelta: monthlySpend - previousMonthlySpend,
      estimatedSavings,
      wasteRiskAmount,
      fastUsageItems,
      slowUsageItems,
    },
    surgery: {
      today: todaySurgeries,
      todayTodo: todaySurgeryTodo,
      todayReadyCount: Math.max(0, todaySurgeries.length - todaySurgeryTodo.length),
      week: weekSurgeries,
      prepPending: surgeryPrepPending,
      usagePending: surgeryUsagePending,
      highCost: highCostSurgeries,
    },
    activity: {
      todayIn,
      todayOut,
      todayTxCount: todayTxs.length,
    },
  };
}
