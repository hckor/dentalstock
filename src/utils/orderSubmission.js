import { getActiveOrder } from "./helpers";

export function buildOrderRequest({ item, qty, note = "", requestedBy, requestedAt, id, vendorSnapshot = {} }) {
  return {
    id,
    item_id: item.id,
    requested_by: requestedBy,
    requested_at: requestedAt,
    qty,
    note,
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    review_note: "",
    ...vendorSnapshot,
  };
}

export function normalizeOrderRequests(orderItems) {
  return (Array.isArray(orderItems) ? orderItems : [])
    .map(entry => ({
      item: entry.item,
      qty: Number(entry.qty),
    }))
    .filter(entry => entry.item?.id && Number.isFinite(entry.qty) && entry.qty > 0);
}

export function getAvailableOrderRequests(requests, orders) {
  const availableRequests = requests.filter(({ item }) => !getActiveOrder(orders, item.id));
  return {
    availableRequests,
    skippedCount: requests.length - availableRequests.length,
  };
}

export function buildOrderRequestNotification({ item, qty, userName, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "order_req",
    item_id: item.id,
    message: `${item.name} 발주 요청이 도착했습니다`,
    sub: `${userName} · ${qty}${item.unit}`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildBulkOrderRequestNotification({ count, skippedCount = 0, userName, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "order_req",
    item_id: null,
    message: `부족 품목 ${count}건 발주 요청이 도착했습니다`,
    sub: `${userName}${skippedCount ? ` · ${skippedCount}건 제외` : ""}`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildOrderRequestAuditMetadata({ item, qty, note = "", vendorSnapshot = {} }) {
  return {
    item_id: item.id,
    item_name: item.name,
    qty,
    note: note || "",
    vendor_id: vendorSnapshot.vendor_id,
    vendor_name: vendorSnapshot.vendor_name,
  };
}

export function buildBulkOrderRequestAuditMetadata({ requests, skippedCount = 0, note = "" }) {
  return {
    count: requests.length,
    skipped_count: skippedCount,
    items: requests.map(({ item, qty }) => `${item.name}:${qty}${item.unit}`).join(", "),
    note: note || "",
  };
}

export function buildOrderRequestToast({ item, count, skippedCount = 0 }) {
  if (item) return `${item.name} 발주 요청 완료`;
  return `${count}건 발주 요청 완료${skippedCount ? ` · ${skippedCount}건 제외` : ""}`;
}
