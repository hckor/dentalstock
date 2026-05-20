import { auditLogsApi } from "../api/auditLogsApi";
import { settingsApi } from "../api/settingsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { appRepository } from "../repositories/appRepository";
import { remoteRepository } from "../repositories/remoteRepository";
import { getActiveOrder } from "../utils/helpers";
import { getOrderVendorKey, resolveOrderVendor } from "../utils/vendorSelection";
import { can } from "../constants/permissions";
import {
  addReceiptShippingEvent,
  addPartialReceiptShippingEvent,
  addShippingProgressEvent,
  buildInitialShippingEvents,
  getNextShippingProgressEvent,
} from "../utils/shippingEvents";

const getStoredShippingEvents = (order) => {
  if (Array.isArray(order?.shipping_events)) return order.shipping_events;
  if (Array.isArray(order?.shipping_timeline)) return order.shipping_timeline;
  return [];
};

const getShipmentPeerOrders = (order, orders) => {
  if (order.shipment_group_id) {
    return orders.filter(o => o.shipment_group_id === order.shipment_group_id && o.status === "ordered");
  }
  const vendorKey = getOrderVendorKey(order);
  if (order.review_note === "일괄 승인" && order.reviewed_at) {
    return orders.filter(o =>
      o.status === "ordered" &&
      o.review_note === "일괄 승인" &&
      o.reviewed_at === order.reviewed_at &&
      o.reviewed_by === order.reviewed_by &&
      getOrderVendorKey(o) === vendorKey
    );
  }
  return [order];
};

const buildVendorSnapshot = (item) => resolveOrderVendor(item, settingsApi.load());

function mergeUpdatedOrder(prevOrders, updatedOrder) {
  return prevOrders.map(order => order.id === updatedOrder.id ? updatedOrder : order);
}

function mergeUpdatedItem(prevItems, updatedItem) {
  return prevItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item);
}

export function useOrderActions({
  orders,
  setOrders,
  items,
  setItems,
  setTxs,
  setNotifs,
  currentUser,
  showToast,
  setModal,
  repositoryAdapter = appRepository.adapter,
  trackingClient = remoteRepository,
}) {
  // ── 발주 요청 → pending 주문 즉시 생성 ───────────────
  const submitOrder = (item, qty, note) => {
    if (getActiveOrder(orders, item.id)) {
      showToast("이미 진행 중인 발주가 있습니다.");
      setModal(null);
      return;
    }
    const now = new Date().toISOString();
    const vendorSnapshot = buildVendorSnapshot(item);
    const newOrder = {
      id: `o${Date.now()}`,
      item_id: item.id,
      requested_by: currentUser.name,
      requested_at: now,
      qty,
      note,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_note: "",
      ...vendorSnapshot,
    };

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.createOrder(currentUser.clinicId, newOrder)
        .then(savedOrder => {
          setOrders(p => [savedOrder, ...p]);
          auditLogsApi.record({
            action: "order.requested",
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: { item_id: item.id, item_name: item.name, qty, note: note || "", vendor_id: vendorSnapshot.vendor_id, vendor_name: vendorSnapshot.vendor_name },
            at: now,
          });
          setNotifs(p => [{
            id: `n${Date.now()}`,
            type: "order_req",
            item_id: item.id,
            message: `${item.name} 발주 요청이 도착했습니다`,
            sub: `${currentUser.name} · ${qty}${item.unit}`,
            is_read: false,
            created_at: now,
          }, ...p]);
          showToast(`${item.name} 발주 요청 완료`);
          setModal(null);
        })
        .catch(() => {
          showToast("발주 요청 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p => [newOrder, ...p]);
    auditLogsApi.record({
      action: "order.requested",
      entityType: "order",
      entityId: newOrder.id,
      actor: currentUser,
      metadata: { item_id: item.id, item_name: item.name, qty, note: note || "", vendor_id: vendorSnapshot.vendor_id, vendor_name: vendorSnapshot.vendor_name },
      at: now,
    });
    setNotifs(p => [{
      id: `n${Date.now()}`,
      type: "order_req",
      item_id: item.id,
      message: `${item.name} 발주 요청이 도착했습니다`,
      sub: `${currentUser.name} · ${qty}${item.unit}`,
      is_read: false,
      created_at: now,
    }, ...p]);
    showToast(`${item.name} 발주 요청 완료`);
    setModal(null);
  };

  const submitBulkOrders = (orderItems, note = "") => {
    const requests = (Array.isArray(orderItems) ? orderItems : [])
      .map(entry => ({
        item: entry.item,
        qty: Number(entry.qty),
      }))
      .filter(entry => entry.item?.id && Number.isFinite(entry.qty) && entry.qty > 0);

    const availableRequests = requests.filter(({ item }) => !getActiveOrder(orders, item.id));
    const skippedCount = requests.length - availableRequests.length;

    if (!availableRequests.length) {
      showToast(skippedCount > 0 ? "이미 발주 중인 품목만 있습니다" : "발주 요청할 품목이 없습니다");
      return;
    }

    const now = new Date().toISOString();
    const newOrders = availableRequests.map(({ item, qty }, index) => ({
      id: `o${Date.now()}-${index}`,
      item_id: item.id,
      requested_by: currentUser.name,
      requested_at: now,
      qty,
      note,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_note: "",
      ...buildVendorSnapshot(item),
    }));

    if (supabaseOrdersApi.isEnabled()) {
      void Promise.all(newOrders.map(order => supabaseOrdersApi.createOrder(currentUser.clinicId, order)))
        .then(savedOrders => {
          setOrders(p => [...savedOrders, ...p]);
          auditLogsApi.record({
            action: "order.bulk_requested",
            entityType: "order",
            entityId: savedOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: {
              count: savedOrders.length,
              skipped_count: skippedCount,
              items: availableRequests.map(({ item, qty }) => `${item.name}:${qty}${item.unit}`).join(", "),
              note: note || "",
            },
            at: now,
          });
          setNotifs(p => [{
            id: `n${Date.now()}`,
            type: "order_req",
            item_id: null,
            message: `부족 품목 ${savedOrders.length}건 발주 요청이 도착했습니다`,
            sub: `${currentUser.name}${skippedCount ? ` · ${skippedCount}건 제외` : ""}`,
            is_read: false,
            created_at: now,
          }, ...p]);
          showToast(`${savedOrders.length}건 발주 요청 완료${skippedCount ? ` · ${skippedCount}건 제외` : ""}`);
          setModal(null);
        })
        .catch(() => {
          showToast("일괄 발주 요청 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p => [...newOrders, ...p]);
    auditLogsApi.record({
      action: "order.bulk_requested",
      entityType: "order",
      entityId: newOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: {
        count: newOrders.length,
        skipped_count: skippedCount,
        items: availableRequests.map(({ item, qty }) => `${item.name}:${qty}${item.unit}`).join(", "),
        note: note || "",
      },
      at: now,
    });
    setNotifs(p => [{
      id: `n${Date.now()}`,
      type: "order_req",
      item_id: null,
      message: `부족 품목 ${newOrders.length}건 발주 요청이 도착했습니다`,
      sub: `${currentUser.name}${skippedCount ? ` · ${skippedCount}건 제외` : ""}`,
      is_read: false,
      created_at: now,
    }, ...p]);
    showToast(`${newOrders.length}건 발주 요청 완료${skippedCount ? ` · ${skippedCount}건 제외` : ""}`);
    setModal(null);
  };

  // ── 발주 승인 (ordered 상태로, 재고 반영 없음) ────────
  const approveOrder = (orderId, reviewNote) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("승인 권한이 없습니다");
      return;
    }
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    const reviewedAt = new Date().toISOString();
    const vendorSnapshot = buildVendorSnapshot(item);
    const nextOrder = { ...order, status:"ordered", reviewed_by:currentUser.name, reviewed_at:reviewedAt, review_note:reviewNote, ...vendorSnapshot };

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.updateOrder(order, nextOrder)
        .then(savedOrder => {
          setOrders(p=>p.map(o=>o.id===orderId?savedOrder:o));
          auditLogsApi.record({
            action: "order.approved",
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: { item_id: item.id, item_name: item.name, qty: order.qty, review_note: reviewNote || "", vendor_id: vendorSnapshot.vendor_id, vendor_name: vendorSnapshot.vendor_name },
            at: reviewedAt,
          });
          setNotifs(p=>[{id:`n${Date.now()}`, type:"ordered", item_id:item.id, message:`${item.name} 발주가 완료되었습니다`, sub:`${vendorSnapshot.vendor_name} · ${order.qty}${item.unit} 배송 대기`, is_read:false, created_at:new Date().toISOString()},...p]);
          showToast("발주가 승인되었습니다.");
        })
        .catch(() => {
          showToast("발주 승인 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"ordered", reviewed_by:currentUser.name, reviewed_at:reviewedAt, review_note:reviewNote, ...vendorSnapshot}:o));
    auditLogsApi.record({
      action: "order.approved",
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: { item_id: item.id, item_name: item.name, qty: order.qty, review_note: reviewNote || "", vendor_id: vendorSnapshot.vendor_id, vendor_name: vendorSnapshot.vendor_name },
      at: reviewedAt,
    });
    setNotifs(p=>[{id:`n${Date.now()}`, type:"ordered", item_id:item.id, message:`${item.name} 발주가 완료되었습니다`, sub:`${vendorSnapshot.vendor_name} · ${order.qty}${item.unit} 배송 대기`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주가 승인되었습니다.");
  };

  const approveOrders = (orderIds, reviewNote = "일괄 승인") => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("승인 권한이 없습니다");
      return;
    }
    const selectedIds = new Set(Array.isArray(orderIds) ? orderIds : []);
    const targetOrders = orders.filter(order => selectedIds.has(order.id) && order.status === "pending");

    if (!targetOrders.length) {
      showToast("승인할 발주 요청이 없습니다");
      return;
    }

    const itemMap = new Map(items.map(item => [item.id, item]));
    const reviewedAt = new Date().toISOString();
    const vendorSnapshots = new Map(targetOrders.map(order => {
      const item = itemMap.get(order.item_id);
      return [order.id, item ? buildVendorSnapshot(item) : {
        vendor_id: order.vendor_id || "",
        vendor_name: order.vendor_name || "거래처 미정",
        vendor_price: order.vendor_price || null,
        vendor_sku: order.vendor_sku || "",
        vendor_selection: order.vendor_selection || "unassigned",
      }];
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
      const shipmentGroupId = `sg${Date.now()}-${index}`;
      ids.forEach(id => shipmentGroupByOrderId.set(id, shipmentGroupId));
    });

    if (supabaseOrdersApi.isEnabled()) {
      const nextOrders = targetOrders.map(order => ({
        ...order,
        ...vendorSnapshots.get(order.id),
        status: "ordered",
        reviewed_by: currentUser.name,
        reviewed_at: reviewedAt,
        review_note: reviewNote,
        shipment_group_id: shipmentGroupByOrderId.get(order.id) || order.shipment_group_id,
      }));
      void Promise.all(nextOrders.map(order => supabaseOrdersApi.updateOrder(order, order)))
        .then(savedOrders => {
          const savedById = new Map(savedOrders.map(order => [order.id, order]));
          setOrders(prev => prev.map(order => savedById.get(order.id) || order));
          auditLogsApi.record({
            action: "order.bulk_approved",
            entityType: "order",
            entityId: savedOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: {
              count: savedOrders.length,
              orders: targetOrders.map(order => {
                const item = itemMap.get(order.item_id);
                const vendor = vendorSnapshots.get(order.id);
                return `${item?.name || order.item_id}:${order.qty}${item?.unit || ""}@${vendor.vendor_name}`;
              }).join(", "),
              review_note: reviewNote || "",
            },
            at: reviewedAt,
          });
          setNotifs(prev => [{
            id: `n${Date.now()}`,
            type: "ordered",
            item_id: null,
            message: `발주 ${savedOrders.length}건이 승인되었습니다`,
            sub: `${vendorGroups.size}개 거래처로 나눠 배송`,
            is_read: false,
            created_at: reviewedAt,
          }, ...prev]);
          showToast(`${savedOrders.length}건 일괄 승인 완료`);
        })
        .catch(() => {
          showToast("일괄 승인 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(prev => prev.map(order => selectedIds.has(order.id) && order.status === "pending"
      ? {
          ...order,
          ...vendorSnapshots.get(order.id),
          status: "ordered",
          reviewed_by: currentUser.name,
          reviewed_at: reviewedAt,
          review_note: reviewNote,
          shipment_group_id: shipmentGroupByOrderId.get(order.id) || order.shipment_group_id,
        }
      : order
    ));
    auditLogsApi.record({
      action: "order.bulk_approved",
      entityType: "order",
      entityId: targetOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: {
        count: targetOrders.length,
        orders: targetOrders.map(order => {
          const item = itemMap.get(order.item_id);
          const vendor = vendorSnapshots.get(order.id);
          return `${item?.name || order.item_id}:${order.qty}${item?.unit || ""}@${vendor.vendor_name}`;
        }).join(", "),
        review_note: reviewNote || "",
      },
      at: reviewedAt,
    });
    setNotifs(prev => [{
      id: `n${Date.now()}`,
      type: "ordered",
      item_id: null,
      message: `발주 ${targetOrders.length}건이 승인되었습니다`,
      sub: `${vendorGroups.size}개 거래처로 나눠 배송`,
      is_read: false,
      created_at: reviewedAt,
    }, ...prev]);
    showToast(`${targetOrders.length}건 일괄 승인 완료`);
  };

  // ── 발주 거절 ────────────────────────────────────────
  const rejectOrder = (orderId, reviewNote) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("거절 권한이 없습니다");
      return;
    }
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    const reviewedAt = new Date().toISOString();
    const nextOrder = { ...order, status:"rejected", reviewed_by:currentUser.name, reviewed_at:reviewedAt, review_note:reviewNote };

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.updateOrder(order, nextOrder)
        .then(savedOrder => {
          setOrders(p=>p.map(o=>o.id===orderId?savedOrder:o));
          auditLogsApi.record({
            action: "order.rejected",
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: { item_id: item.id, item_name: item.name, qty: order.qty, review_note: reviewNote || "" },
            at: reviewedAt,
          });
          setNotifs(p=>[{id:`n${Date.now()}`, type:"order_rejected", item_id:item.id, message:`${item.name} 발주가 거절되었습니다`, sub:`${currentUser.name} · ${reviewNote||"사유 없음"}`, is_read:false, created_at:new Date().toISOString()},...p]);
          showToast("발주 요청이 거절되었습니다");
        })
        .catch(() => {
          showToast("발주 반려 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"rejected", reviewed_by:currentUser.name, reviewed_at:reviewedAt, review_note:reviewNote}:o));
    auditLogsApi.record({
      action: "order.rejected",
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: { item_id: item.id, item_name: item.name, qty: order.qty, review_note: reviewNote || "" },
      at: reviewedAt,
    });
    setNotifs(p=>[{id:`n${Date.now()}`, type:"order_rejected", item_id:item.id, message:`${item.name} 발주가 거절되었습니다`, sub:`${currentUser.name} · ${reviewNote||"사유 없음"}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주 요청이 거절되었습니다");
  };

  // ── 실 입고 확인 (ordered → received, 재고 반영) ──────
  const confirmReceipt = (orderId, actualQty, note) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("입고 확인 권한이 없습니다");
      return;
    }
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "ordered") {
      showToast("입고 확인할 발주를 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("입고 품목을 찾을 수 없습니다.");
      return;
    }
    const alreadyReceived = Number(order.received_qty) || 0;
    const nextReceivedQty = alreadyReceived + actualQty;
    const isFullyReceived = nextReceivedQty >= order.qty;
    const after = item.current_qty + actualQty;
    const receivedAt = new Date().toISOString();
    const nextOrder = {
      ...order,
      status: isFullyReceived ? "received" : "ordered",
      received_qty: nextReceivedQty,
      received_at: isFullyReceived ? receivedAt : order.received_at,
      partial_received_at: isFullyReceived ? order.partial_received_at : receivedAt,
      shipping_events: isFullyReceived
        ? addReceiptShippingEvent(order, receivedAt)
        : addPartialReceiptShippingEvent(order, receivedAt, nextReceivedQty, order.qty),
    };

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.receiveOrder(nextOrder, { actualQty, note })
        .then(({ order: savedOrder, item: savedItem }) => {
          const mergedOrder = {
            ...savedOrder,
            shipping_events: nextOrder.shipping_events,
            received_qty: nextReceivedQty,
            received_at: nextOrder.received_at,
            partial_received_at: nextOrder.partial_received_at,
          };
          setItems(p=>mergeUpdatedItem(p, savedItem));
          setTxs(p=>[{id:`t${Date.now()}`, item_id:item.id, type:"in", qty:actualQty, note:`발주 입고 확인 (요청자: ${order.requested_by})${note?` · ${note}`:""}`, created_at:receivedAt, user:currentUser.name},...p]);
          setOrders(p=>mergeUpdatedOrder(p, mergedOrder));
          auditLogsApi.record({
            action: "order.received",
            entityType: "order",
            entityId: orderId,
            actor: currentUser,
            metadata: {
              item_id: item.id,
              item_name: item.name,
              ordered_qty: order.qty,
              received_qty: actualQty,
              total_received_qty: nextReceivedQty,
              remaining_qty: Math.max(0, order.qty - nextReceivedQty),
              before_qty: item.current_qty,
              after_qty: savedItem.current_qty,
              note: note || "",
            },
            at: receivedAt,
          });
          setNotifs(p=>[{id:`n${Date.now()}`, type:"received", item_id:item.id, message:isFullyReceived ? `${item.name} 입고 확인 완료` : `${item.name} 부분 입고 확인`, sub:`${currentUser.name} 확인 · ${actualQty}${item.unit} 입고`, is_read:false, created_at:receivedAt},...p]);
          showToast(isFullyReceived ? `${actualQty}${item.unit} 입고 확인 완료` : `${actualQty}${item.unit} 부분 입고 확인`);
          setModal(null);
        })
        .catch(() => {
          showToast("입고 확인 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setItems(p=>p.map(i=>i.id===item.id?{...i, current_qty:after}:i));
    setTxs(p=>[{id:`t${Date.now()}`, item_id:item.id, type:"in", qty:actualQty, note:`발주 입고 확인 (요청자: ${order.requested_by})${note?` · ${note}`:""}`, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    setOrders(p=>p.map(o=>o.id===orderId?nextOrder:o));
    auditLogsApi.record({
      action: "order.received",
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: {
        item_id: item.id,
        item_name: item.name,
        ordered_qty: order.qty,
        received_qty: actualQty,
        total_received_qty: nextReceivedQty,
        remaining_qty: Math.max(0, order.qty - nextReceivedQty),
        before_qty: item.current_qty,
        after_qty: after,
        note: note || "",
      },
      at: receivedAt,
    });
    setNotifs(p=>[{id:`n${Date.now()}`, type:"received", item_id:item.id, message:isFullyReceived ? `${item.name} 입고 확인 완료` : `${item.name} 부분 입고 확인`, sub:`${currentUser.name} 확인 · ${actualQty}${item.unit} 입고`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(isFullyReceived ? `${actualQty}${item.unit} 입고 확인 완료` : `${actualQty}${item.unit} 부분 입고 확인`);
    setModal(null);
  };

  const confirmReceipts = (receipts, note = "") => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("입고 확인 권한이 없습니다");
      return;
    }

    const receiptRows = (Array.isArray(receipts) ? receipts : [])
      .map(receipt => ({
        orderId: receipt.orderId,
        actualQty: Number(receipt.actualQty),
      }))
      .filter(receipt => receipt.orderId && Number.isFinite(receipt.actualQty) && receipt.actualQty > 0);

    const orderMap = new Map(orders.map(order => [order.id, order]));
    const itemMap = new Map(items.map(item => [item.id, item]));
    const validRows = receiptRows
      .map(receipt => {
        const order = orderMap.get(receipt.orderId);
        const item = order ? itemMap.get(order.item_id) : null;
        return order?.status === "ordered" && item ? { ...receipt, order, item } : null;
      })
      .filter(Boolean);

    if (!validRows.length) {
      showToast("입고 확인할 배송건이 없습니다");
      return;
    }

    const receivedAt = new Date().toISOString();
    const qtyByItemId = new Map();
    validRows.forEach(({ item, actualQty }) => {
      qtyByItemId.set(item.id, (qtyByItemId.get(item.id) || 0) + actualQty);
    });

    const targetIds = new Set(validRows.map(row => row.order.id));
    const receiptByOrderId = new Map(validRows.map(row => {
      const alreadyReceived = Number(row.order.received_qty) || 0;
      const totalReceived = alreadyReceived + row.actualQty;
      const isFullyReceived = totalReceived >= row.order.qty;
      return [row.order.id, { ...row, totalReceived, isFullyReceived }];
    }));

    if (supabaseOrdersApi.isEnabled()) {
      void Promise.all(validRows.map(row => {
        const receipt = receiptByOrderId.get(row.order.id);
        const nextOrder = {
          ...row.order,
          status: receipt.isFullyReceived ? "received" : "ordered",
          received_qty: receipt.totalReceived,
          received_at: receipt.isFullyReceived ? receivedAt : row.order.received_at,
          partial_received_at: receipt.isFullyReceived ? row.order.partial_received_at : receivedAt,
          shipping_events: receipt.isFullyReceived
            ? addReceiptShippingEvent(row.order, receivedAt)
            : addPartialReceiptShippingEvent(row.order, receivedAt, receipt.totalReceived, row.order.qty),
        };
        return supabaseOrdersApi.receiveOrder(nextOrder, { actualQty: row.actualQty, note })
          .then(result => ({ ...result, original: row, nextOrder }));
      }))
        .then(results => {
          const updatedItems = new Map(results.map(result => [result.item.id, result.item]));
          const updatedOrders = new Map(results.map(result => [result.order.id, {
            ...result.order,
            shipping_events: result.nextOrder.shipping_events,
            received_qty: result.nextOrder.received_qty,
            received_at: result.nextOrder.received_at,
            partial_received_at: result.nextOrder.partial_received_at,
          }]));
          setItems(prev => prev.map(item => updatedItems.get(item.id) ? { ...item, ...updatedItems.get(item.id) } : item));
          setTxs(prev => [
            ...validRows.map(({ order, item, actualQty }, index) => ({
              id: `t${Date.now()}-${index}`,
              item_id: item.id,
              type: "in",
              qty: actualQty,
              note: `묶음 배송 입고 확인 (요청자: ${order.requested_by})${note ? ` · ${note}` : ""}`,
              created_at: receivedAt,
              user: currentUser.name,
            })),
            ...prev,
          ]);
          setOrders(prev => prev.map(order => updatedOrders.get(order.id) || order));
          const completedCount = Array.from(receiptByOrderId.values()).filter(row => row.isFullyReceived).length;
          const partialCount = validRows.length - completedCount;
          auditLogsApi.record({
            action: "order.bulk_received",
            entityType: "order",
            entityId: validRows.map(row => row.order.id).join(","),
            actor: currentUser,
            metadata: {
              count: validRows.length,
              orders: validRows.map(({ order, item, actualQty }) => `${item.name}:${actualQty}${item.unit}/${order.qty}${item.unit}`).join(", "),
              completed_count: completedCount,
              partial_count: partialCount,
              note: note || "",
            },
            at: receivedAt,
          });
          setNotifs(prev => [{
            id: `n${Date.now()}`,
            type: "received",
            item_id: null,
            message: partialCount ? `묶음 배송 ${validRows.length}건 수량 확인` : `묶음 배송 ${validRows.length}건 입고 확인 완료`,
            sub: partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${currentUser.name} 확인`,
            is_read: false,
            created_at: receivedAt,
          }, ...prev]);
          showToast(partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${validRows.length}건 입고 수량 확인 완료`);
          setModal(null);
        })
        .catch(() => {
          showToast("묶음 입고 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setItems(prev => prev.map(item => qtyByItemId.has(item.id)
      ? { ...item, current_qty: item.current_qty + qtyByItemId.get(item.id) }
      : item
    ));

    setTxs(prev => [
      ...validRows.map(({ order, item, actualQty }, index) => ({
        id: `t${Date.now()}-${index}`,
        item_id: item.id,
        type: "in",
        qty: actualQty,
        note: `묶음 배송 입고 확인 (요청자: ${order.requested_by})${note ? ` · ${note}` : ""}`,
        created_at: receivedAt,
        user: currentUser.name,
      })),
      ...prev,
    ]);

    setOrders(prev => prev.map(order => targetIds.has(order.id)
      ? {
          ...order,
          status: receiptByOrderId.get(order.id).isFullyReceived ? "received" : "ordered",
          received_qty: receiptByOrderId.get(order.id).totalReceived,
          received_at: receiptByOrderId.get(order.id).isFullyReceived ? receivedAt : order.received_at,
          partial_received_at: receiptByOrderId.get(order.id).isFullyReceived ? order.partial_received_at : receivedAt,
          shipping_events: receiptByOrderId.get(order.id).isFullyReceived
            ? addReceiptShippingEvent(order, receivedAt)
            : addPartialReceiptShippingEvent(order, receivedAt, receiptByOrderId.get(order.id).totalReceived, order.qty),
        }
      : order
    ));

    const completedCount = Array.from(receiptByOrderId.values()).filter(row => row.isFullyReceived).length;
    const partialCount = validRows.length - completedCount;

    auditLogsApi.record({
      action: "order.bulk_received",
      entityType: "order",
      entityId: validRows.map(row => row.order.id).join(","),
      actor: currentUser,
      metadata: {
        count: validRows.length,
        orders: validRows.map(({ order, item, actualQty }) => `${item.name}:${actualQty}${item.unit}/${order.qty}${item.unit}`).join(", "),
        completed_count: completedCount,
        partial_count: partialCount,
        note: note || "",
      },
      at: receivedAt,
    });

    setNotifs(prev => [{
      id: `n${Date.now()}`,
      type: "received",
      item_id: null,
      message: partialCount ? `묶음 배송 ${validRows.length}건 수량 확인` : `묶음 배송 ${validRows.length}건 입고 확인 완료`,
      sub: partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${currentUser.name} 확인`,
      is_read: false,
      created_at: receivedAt,
    }, ...prev]);
    showToast(partialCount ? `완료 ${completedCount}건 · 부분입고 ${partialCount}건` : `${validRows.length}건 입고 수량 확인 완료`);
    setModal(null);
  };

  // ── 송장 등록 (ordered 상태에 배송 정보 저장) ──────────
  const startTracking = (orderId, carrier, trackingNumber) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("송장 등록 권한이 없습니다");
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== "ordered") {
      showToast("송장 등록할 주문을 찾을 수 없습니다.");
      return;
    }
    const item = items.find(i => i.id === order.item_id);
    const trackingStartedAt = new Date().toISOString();
    const targetOrders = getShipmentPeerOrders(order, orders);
    const targetIds = new Set(targetOrders.map(o => o.id));
    const nextOrders = targetOrders.map(o => ({
      ...o,
      carrier,
      tracking_number: trackingNumber,
      shipping_events: buildInitialShippingEvents({ order: o, carrier, timestamp: trackingStartedAt }),
    }));

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.updateOrders(nextOrders)
        .then(savedOrders => {
          const savedById = new Map(savedOrders.map(savedOrder => {
            const nextOrder = nextOrders.find(candidate => candidate.id === savedOrder.id);
            return [savedOrder.id, { ...savedOrder, shipping_events: nextOrder?.shipping_events || savedOrder.shipping_events }];
          }));
          setOrders(p => p.map(o => savedById.get(o.id) || o));
          auditLogsApi.record({
            action: "order.tracking_registered",
            entityType: "order",
            entityId: targetOrders.map(o => o.id).join(","),
            actor: currentUser,
            metadata: {
              item_id: order.item_id,
              order_count: targetOrders.length,
              shipment_group_id: order.shipment_group_id || "",
              carrier,
              tracking_number_last4: String(trackingNumber || "").slice(-4),
            },
            at: trackingStartedAt,
          });
          if (item) {
            setNotifs(p => [{ id: `n${Date.now()}`, type: "ordered", item_id: item.id, message: targetOrders.length > 1 ? `묶음 배송 ${targetOrders.length}건 송장이 등록됐습니다` : `${item.name} 송장이 등록됐습니다`, sub: `${carrier} · ${trackingNumber}`, is_read: false, created_at: new Date().toISOString() }, ...p]);
          }
          showToast(targetOrders.length > 1 ? `${targetOrders.length}건 묶음 송장이 등록됐습니다` : "송장이 등록됐습니다");
        })
        .catch(() => {
          showToast("송장 등록 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p => p.map(o => targetIds.has(o.id)
      ? { ...o, carrier, tracking_number: trackingNumber, shipping_events: buildInitialShippingEvents({ order: o, carrier, timestamp: trackingStartedAt }) }
      : o
    ));
    auditLogsApi.record({
      action: "order.tracking_registered",
      entityType: "order",
      entityId: targetOrders.map(o => o.id).join(","),
      actor: currentUser,
      metadata: {
        item_id: order.item_id,
        order_count: targetOrders.length,
        shipment_group_id: order.shipment_group_id || "",
        carrier,
        tracking_number_last4: String(trackingNumber || "").slice(-4),
      },
      at: trackingStartedAt,
    });
    if (item) {
      setNotifs(p => [{ id: `n${Date.now()}`, type: "ordered", item_id: item.id, message: targetOrders.length > 1 ? `묶음 배송 ${targetOrders.length}건 송장이 등록됐습니다` : `${item.name} 송장이 등록됐습니다`, sub: `${carrier} · ${trackingNumber}`, is_read: false, created_at: new Date().toISOString() }, ...p]);
    }
    showToast(targetOrders.length > 1 ? `${targetOrders.length}건 묶음 송장이 등록됐습니다` : "송장이 등록됐습니다");
  };

  const refreshTracking = async (orderId) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("배송 갱신 권한이 없습니다");
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== "ordered" || !order.tracking_number) {
      showToast("갱신할 송장 정보를 찾을 수 없습니다.");
      return;
    }
    const item = items.find(i => i.id === order.item_id);
    const refreshedAt = new Date().toISOString();
    let nextEvent = null;
    const targetOrders = getShipmentPeerOrders(order, orders);
    const targetIds = new Set(targetOrders.map(o => o.id));

    if (repositoryAdapter.isRemoteEnabled) {
      try {
        const tracking = await trackingClient.refreshTracking({
          carrier: order.carrier,
          trackingNumber: order.tracking_number,
          currentStatuses: getStoredShippingEvents(order).map(event => event.status).filter(Boolean),
        });
        nextEvent = tracking?.events?.[0] || null;
      } catch {
        showToast("배송 조회 서버에 연결할 수 없습니다");
        return;
      }
    } else {
      nextEvent = getNextShippingProgressEvent(order, refreshedAt);
    }

    if (!nextEvent) {
      showToast("이미 최신 배송 상태입니다");
      return;
    }

    const nextOrders = targetOrders.map(o => ({
      ...o,
      delivery_completed_at: nextEvent.status === "배달완료" ? refreshedAt : o.delivery_completed_at,
      shipping_events: addShippingProgressEvent(o, nextEvent),
    }));

    if (supabaseOrdersApi.isEnabled()) {
      void supabaseOrdersApi.updateOrders(nextOrders)
        .then(savedOrders => {
          const savedById = new Map(savedOrders.map(savedOrder => {
            const nextOrder = nextOrders.find(candidate => candidate.id === savedOrder.id);
            return [savedOrder.id, {
              ...savedOrder,
              delivery_completed_at: nextOrder?.delivery_completed_at,
              shipping_events: nextOrder?.shipping_events || savedOrder.shipping_events,
            }];
          }));
          setOrders(p => p.map(o => savedById.get(o.id) || o));
          auditLogsApi.record({
            action: nextEvent.status === "배달완료" ? "order.delivered" : "order.tracking_refreshed",
            entityType: "order",
            entityId: targetOrders.map(o => o.id).join(","),
            actor: currentUser,
            metadata: {
              item_id: order.item_id,
              order_count: targetOrders.length,
              shipment_group_id: order.shipment_group_id || "",
              carrier: order.carrier || "",
              tracking_number_last4: String(order.tracking_number || "").slice(-4),
              shipping_status: nextEvent.status,
            },
            at: refreshedAt,
          });
          if (item && nextEvent.status === "배달완료") {
            setNotifs(p => [{
              id: `n${Date.now()}`,
              type: "delivered",
              item_id: item.id,
              message: targetOrders.length > 1 ? `묶음 배송 ${targetOrders.length}건 배달완료` : `${item.name} 배달완료`,
              sub: "입고 확인이 필요합니다",
              is_read: false,
              created_at: refreshedAt,
            }, ...p]);
            showToast("배달완료 알림이 생성되었습니다");
            return;
          }
          showToast("배송 상태가 갱신되었습니다");
        })
        .catch(() => {
          showToast("배송 상태 저장에 실패했습니다. 다시 시도해주세요.");
        });
      return;
    }

    setOrders(p => p.map(o => targetIds.has(o.id)
      ? {
          ...o,
          delivery_completed_at: nextEvent.status === "배달완료" ? refreshedAt : o.delivery_completed_at,
          shipping_events: addShippingProgressEvent(o, nextEvent),
        }
      : o
    ));

    auditLogsApi.record({
      action: nextEvent.status === "배달완료" ? "order.delivered" : "order.tracking_refreshed",
      entityType: "order",
      entityId: targetOrders.map(o => o.id).join(","),
      actor: currentUser,
      metadata: {
        item_id: order.item_id,
        order_count: targetOrders.length,
        shipment_group_id: order.shipment_group_id || "",
        carrier: order.carrier || "",
        tracking_number_last4: String(order.tracking_number || "").slice(-4),
        shipping_status: nextEvent.status,
      },
      at: refreshedAt,
    });

    if (item && nextEvent.status === "배달완료") {
      setNotifs(p => [{
        id: `n${Date.now()}`,
        type: "delivered",
        item_id: item.id,
        message: targetOrders.length > 1 ? `묶음 배송 ${targetOrders.length}건 배달완료` : `${item.name} 배달완료`,
        sub: "입고 확인이 필요합니다",
        is_read: false,
        created_at: refreshedAt,
      }, ...p]);
      showToast("배달완료 알림이 생성되었습니다");
      return;
    }

    showToast("배송 상태가 갱신되었습니다");
  };

  return { submitOrder, submitBulkOrders, approveOrder, approveOrders, rejectOrder, confirmReceipt, confirmReceipts, startTracking, refreshTracking };
}
