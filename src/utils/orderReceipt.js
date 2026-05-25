import {
  addPartialReceiptShippingEvent,
  addReceiptShippingEvent,
} from "./shippingEvents";

export function normalizeReceiptRows(receipts) {
  return (Array.isArray(receipts) ? receipts : [])
    .map(receipt => ({
      orderId: receipt.orderId,
      actualQty: Number(receipt.actualQty),
    }))
    .filter(receipt => receipt.orderId && Number.isFinite(receipt.actualQty) && receipt.actualQty > 0);
}

export function getValidReceiptRows(receipts, orders, items) {
  const orderMap = new Map(orders.map(order => [order.id, order]));
  const itemMap = new Map(items.map(item => [item.id, item]));

  return normalizeReceiptRows(receipts)
    .map(receipt => {
      const order = orderMap.get(receipt.orderId);
      const item = order ? itemMap.get(order.item_id) : null;
      return order?.status === "ordered" && item ? { ...receipt, order, item } : null;
    })
    .filter(Boolean);
}

export function buildReceiptState({ order, actualQty, receivedAt }) {
  const alreadyReceived = Number(order.received_qty) || 0;
  const totalReceived = alreadyReceived + actualQty;
  const isFullyReceived = totalReceived >= order.qty;

  return {
    totalReceived,
    isFullyReceived,
    nextOrder: {
      ...order,
      status: isFullyReceived ? "received" : "ordered",
      received_qty: totalReceived,
      received_at: isFullyReceived ? receivedAt : order.received_at,
      partial_received_at: isFullyReceived ? order.partial_received_at : receivedAt,
      shipping_events: isFullyReceived
        ? addReceiptShippingEvent(order, receivedAt)
        : addPartialReceiptShippingEvent(order, receivedAt, totalReceived, order.qty),
    },
  };
}

export function buildReceiptTx({ order, item, actualQty, note = "", currentUserName, receivedAt, id }) {
  return {
    id,
    item_id: item.id,
    type: "in",
    qty: actualQty,
    note: `발주 입고 확인 (요청자: ${order.requested_by})${note ? ` · ${note}` : ""}`,
    created_at: receivedAt,
    user: currentUserName,
  };
}

export function buildBulkReceiptTx({ order, item, actualQty, note = "", currentUserName, receivedAt, id }) {
  return {
    id,
    item_id: item.id,
    type: "in",
    qty: actualQty,
    note: `묶음 배송 입고 확인 (요청자: ${order.requested_by})${note ? ` · ${note}` : ""}`,
    created_at: receivedAt,
    user: currentUserName,
  };
}

export function buildReceiptAuditMetadata({ item, order, actualQty, totalReceived, beforeQty, afterQty, note = "" }) {
  return {
    item_id: item.id,
    item_name: item.name,
    ordered_qty: order.qty,
    received_qty: actualQty,
    total_received_qty: totalReceived,
    remaining_qty: Math.max(0, order.qty - totalReceived),
    before_qty: beforeQty,
    after_qty: afterQty,
    note: note || "",
  };
}

export function buildReceiptNotification({ item, actualQty, currentUserName, isFullyReceived, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "received",
    item_id: item.id,
    message: isFullyReceived ? `${item.name} 입고 확인 완료` : `${item.name} 부분 입고 확인`,
    sub: `${currentUserName} 확인 · ${actualQty}${item.unit} 입고`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildReceiptToast({ item, actualQty, isFullyReceived }) {
  return isFullyReceived ? `${actualQty}${item.unit} 입고 확인 완료` : `${actualQty}${item.unit} 부분 입고 확인`;
}

export function buildBulkReceiptPlan({ receipts, orders, items, note = "", currentUserName, receivedAt }) {
  const validRows = getValidReceiptRows(receipts, orders, items);
  const qtyByItemId = new Map();
  const receiptByOrderId = new Map();

  validRows.forEach(row => {
    qtyByItemId.set(row.item.id, (qtyByItemId.get(row.item.id) || 0) + row.actualQty);
    receiptByOrderId.set(row.order.id, { ...row, ...buildReceiptState({ order: row.order, actualQty: row.actualQty, receivedAt }) });
  });

  const completedCount = Array.from(receiptByOrderId.values()).filter(row => row.isFullyReceived).length;
  const partialCount = validRows.length - completedCount;

  return {
    validRows,
    qtyByItemId,
    targetIds: new Set(validRows.map(row => row.order.id)),
    receiptByOrderId,
    txs: validRows.map(({ order, item, actualQty }, index) => buildBulkReceiptTx({
      order,
      item,
      actualQty,
      note,
      currentUserName,
      receivedAt,
      id: `t${Date.now()}-${index}`,
    })),
    completedCount,
    partialCount,
    auditMetadata: buildBulkReceiptAuditMetadata({ validRows, completedCount, partialCount, note }),
    notification: buildBulkReceiptNotification({ count: validRows.length, completedCount, partialCount, currentUserName, createdAt: receivedAt }),
    toast: buildBulkReceiptToast({ count: validRows.length, completedCount, partialCount }),
  };
}

export function buildBulkReceiptAuditMetadata({ validRows, completedCount, partialCount, note = "" }) {
  return {
    count: validRows.length,
    orders: validRows.map(({ order, item, actualQty }) => `${item.name}:${actualQty}${item.unit}/${order.qty}${item.unit}`).join(", "),
    completed_count: completedCount,
    partial_count: partialCount,
    note: note || "",
  };
}

export function buildBulkReceiptNotification({ count, completedCount, partialCount, currentUserName, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: "received",
    item_id: null,
    message: partialCount ? `묶음 배송 ${count}건 수량 확인` : `묶음 배송 ${count}건 입고 확인 완료`,
    sub: partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${currentUserName} 확인`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildBulkReceiptToast({ count, completedCount, partialCount }) {
  return partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${count}건 입고 수량 확인 완료`;
}
