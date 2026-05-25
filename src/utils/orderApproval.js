import { ORDER_STATUS } from "../constants/orderStates";
import {
  canRoleTransitionOrderStatus,
  getOrderTransitionPermissions,
  isOrderTransitionAllowed,
} from "./orderStateMachine";
import {
  getMonthlyProjectedAmounts,
  getOrderApprovalGate,
  getOrderDuplicateInfo,
} from "./orderReview";

export function buildFallbackVendorSnapshot(order) {
  return {
    vendor_id: order.vendor_id || "",
    vendor_name: order.vendor_name || "거래처 미정",
    vendor_price: order.vendor_price || null,
    vendor_sku: order.vendor_sku || "",
    vendor_url: order.vendor_url || "",
    vendor_selection: order.vendor_selection || "unassigned",
  };
}

function buildActionAvailability({ role, order, targetStatus, requiresOwnerApproval = false, gateReasons = [] }) {
  const transitionAllowed = Boolean(order) && isOrderTransitionAllowed(order.status, targetStatus, { allowNoop: false });
  const permissions = transitionAllowed
    ? getOrderTransitionPermissions(order.status, targetStatus, { requiresOwnerApproval })
    : [];
  const allowed = transitionAllowed && canRoleTransitionOrderStatus(role, order.status, targetStatus, { requiresOwnerApproval });

  return {
    allowed,
    transitionAllowed,
    permissions,
    missingPermissions: allowed ? [] : permissions,
    requiresOwnerApproval: targetStatus === ORDER_STATUS.ordered ? requiresOwnerApproval : false,
    reasons: targetStatus === ORDER_STATUS.ordered ? gateReasons : [],
  };
}

export function getOrderActionAvailability({
  order,
  item,
  orders = [],
  items = [],
  currentUser = null,
  role = currentUser?.role,
  duplicateInfo = null,
  monthlyProjectedAmount = null,
} = {}) {
  const allOrders = orders.length ? orders : (order ? [order] : []);
  const allItems = items.length ? items : (item ? [item] : []);
  const resolvedDuplicateInfo = duplicateInfo ?? (order ? getOrderDuplicateInfo(order, allOrders) : null);
  const projectedAmount = monthlyProjectedAmount ?? (
    order ? getMonthlyProjectedAmounts(allOrders, allItems)[order.id] || 0 : 0
  );
  const gate = order && item
    ? getOrderApprovalGate(order, item, resolvedDuplicateInfo, projectedAmount)
    : { requiresOwnerApproval: false, reasons: [] };

  return {
    gate,
    approve: buildActionAvailability({
      role,
      order: order && item ? order : null,
      targetStatus: ORDER_STATUS.ordered,
      requiresOwnerApproval: gate.requiresOwnerApproval,
      gateReasons: gate.reasons,
    }),
    hold: buildActionAvailability({ role, order, targetStatus: ORDER_STATUS.hold }),
    reject: buildActionAvailability({ role, order, targetStatus: ORDER_STATUS.rejected }),
  };
}

export function buildApprovedOrder({
  order,
  currentUserName,
  reviewedAt,
  reviewNote = "",
  vendorSnapshot = {},
  shipmentGroupId,
}) {
  return {
    ...order,
    ...vendorSnapshot,
    status: "ordered",
    reviewed_by: currentUserName,
    reviewed_at: reviewedAt,
    review_note: reviewNote,
    shipment_group_id: shipmentGroupId || order.shipment_group_id,
  };
}

export function buildApprovalAuditMetadata({ item, order, reviewNote = "", vendorSnapshot = {} }) {
  return {
    item_id: item.id,
    item_name: item.name,
    qty: order.qty,
    review_note: reviewNote || "",
    vendor_id: vendorSnapshot.vendor_id,
    vendor_name: vendorSnapshot.vendor_name,
  };
}

export function buildBulkApprovalPlan({
  targetOrders,
  items,
  currentUserName,
  reviewedAt,
  reviewNote = "일괄 승인",
  buildVendorSnapshot,
  createShipmentGroupId = (index) => `sg${Date.now()}-${index}`,
}) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const vendorSnapshots = new Map(targetOrders.map(order => {
    const item = itemMap.get(order.item_id);
    return [order.id, item ? buildVendorSnapshot(item, order.qty) : buildFallbackVendorSnapshot(order)];
  }));
  const vendorGroups = new Map();

  targetOrders.forEach(order => {
    const vendorKey = vendorSnapshots.get(order.id).vendor_id || "unassigned";
    if (!vendorGroups.has(vendorKey)) vendorGroups.set(vendorKey, []);
    vendorGroups.get(vendorKey).push(order.id);
  });

  const shipmentGroupByOrderId = new Map();
  Array.from(vendorGroups.values()).forEach((ids, index) => {
    if (ids.length < 2) return;
    const shipmentGroupId = createShipmentGroupId(index);
    ids.forEach(id => shipmentGroupByOrderId.set(id, shipmentGroupId));
  });

  const nextOrders = targetOrders.map(order => buildApprovedOrder({
    order,
    currentUserName,
    reviewedAt,
    reviewNote,
    vendorSnapshot: vendorSnapshots.get(order.id),
    shipmentGroupId: shipmentGroupByOrderId.get(order.id),
  }));

  return {
    itemMap,
    vendorSnapshots,
    vendorGroups,
    shipmentGroupByOrderId,
    nextOrders,
    auditMetadata: buildBulkApprovalAuditMetadata({ targetOrders, itemMap, vendorSnapshots, reviewNote }),
  };
}

export function buildBulkApprovalAuditMetadata({ targetOrders, itemMap, vendorSnapshots, reviewNote = "" }) {
  return {
    count: targetOrders.length,
    orders: targetOrders.map(order => {
      const item = itemMap.get(order.item_id);
      const vendor = vendorSnapshots.get(order.id);
      return `${item?.name || order.item_id}:${order.qty}${item?.unit || ""}@${vendor.vendor_name}`;
    }).join(", "),
    review_note: reviewNote || "",
  };
}

export function buildOrderApprovedNotification({ item, order, vendorSnapshot, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "ordered",
    item_id: item.id,
    message: `${item.name} 발주가 완료되었습니다`,
    sub: `${vendorSnapshot.vendor_name} · ${order.qty}${item.unit} 배송 대기`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildBulkOrderApprovedNotification({ count, vendorGroupCount, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "ordered",
    item_id: null,
    message: `발주 ${count}건이 승인되었습니다`,
    sub: `${vendorGroupCount}개 거래처로 나눠 배송`,
    is_read: false,
    created_at: createdAt,
  };
}
