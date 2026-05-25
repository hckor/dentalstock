import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { ORDER_STATUS } from "../constants/orderStates";
import { can } from "../constants/permissions";
import { handleAppError } from "../utils/errorHandling";
import {
  buildBulkReceiptPlan,
  buildReceiptAuditMetadata,
  buildReceiptNotification,
  buildReceiptState,
  buildReceiptToast,
  buildReceiptTx,
  getValidReceiptRows,
} from "../utils/orderReceipt";
import { isOrderTransitionAllowed } from "../utils/orderStateMachine";
import { mergeUpdatedItem, mergeUpdatedOrder, shouldUseSupabaseOrders } from "./orderActionShared";

export function useOrderReceiptActions({
  orders,
  setOrders,
  items,
  setItems,
  setTxs,
  setNotifs,
  currentUser,
  showToast,
  setModal,
}) {
  const confirmReceipt = useCallback((orderId, actualQty, note) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("입고 확인 권한이 없습니다");
      return;
    }

    const order = orders.find(candidate => candidate.id === orderId);
    if (!order || !isOrderTransitionAllowed(order.status, ORDER_STATUS.received, { allowNoop: false })) {
      showToast("입고 확인할 발주를 찾을 수 없습니다.");
      return;
    }

    const item = items.find(candidate => candidate.id === order.item_id);
    if (!item) {
      showToast("입고 품목을 찾을 수 없습니다.");
      return;
    }

    const after = item.current_qty + actualQty;
    const receivedAt = new Date().toISOString();
    const { totalReceived, isFullyReceived, nextOrder } = buildReceiptState({ order, actualQty, receivedAt });
    const receiptTx = buildReceiptTx({
      order,
      item,
      actualQty,
      note,
      currentUserName: currentUser.name,
      receivedAt,
      id: `t${Date.now()}`,
    });
    const notification = buildReceiptNotification({ item, actualQty, currentUserName: currentUser.name, isFullyReceived, createdAt: receivedAt });

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.receiveOrder(nextOrder, { actualQty, note })
        .then(({ order: savedOrder, item: savedItem }) => {
          const mergedOrder = {
            ...savedOrder,
            shipping_events: nextOrder.shipping_events,
            received_qty: totalReceived,
            received_at: nextOrder.received_at,
            partial_received_at: nextOrder.partial_received_at,
          };
          setItems(prev => mergeUpdatedItem(prev, savedItem));
          setTxs(prev => [receiptTx, ...prev]);
          setOrders(prev => mergeUpdatedOrder(prev, mergedOrder));
          auditLogsApi.record({
            action: "order.received",
            entityType: "order",
            entityId: orderId,
            actor: currentUser,
            metadata: buildReceiptAuditMetadata({ item, order, actualQty, totalReceived, beforeQty: item.current_qty, afterQty: savedItem.current_qty, note }),
            at: receivedAt,
          });
          setNotifs(prev => [notification, ...prev]);
          showToast(buildReceiptToast({ item, actualQty, isFullyReceived }));
          setModal(null);
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.receive",
            userMessage: "입고 확인 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setItems(prev => prev.map(candidate => candidate.id === item.id ? { ...candidate, current_qty: after } : candidate));
    setTxs(prev => [receiptTx, ...prev]);
    setOrders(prev => prev.map(candidate => candidate.id === orderId ? nextOrder : candidate));
    auditLogsApi.record({
      action: "order.received",
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: buildReceiptAuditMetadata({ item, order, actualQty, totalReceived, beforeQty: item.current_qty, afterQty: after, note }),
      at: receivedAt,
    });
    setNotifs(prev => [notification, ...prev]);
    showToast(buildReceiptToast({ item, actualQty, isFullyReceived }));
    setModal(null);
  }, [currentUser, items, orders, setItems, setModal, setNotifs, setOrders, setTxs, showToast]);

  const confirmReceipts = useCallback((receipts, note = "") => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("입고 확인 권한이 없습니다");
      return;
    }

    const validRows = getValidReceiptRows(receipts, orders, items);

    if (!validRows.length) {
      showToast("입고 확인할 배송건이 없습니다");
      return;
    }

    const receivedAt = new Date().toISOString();
    const receiptPlan = buildBulkReceiptPlan({ receipts, orders, items, note, currentUserName: currentUser.name, receivedAt });
    const { qtyByItemId, targetIds, receiptByOrderId } = receiptPlan;

    if (shouldUseSupabaseOrders(currentUser)) {
      void Promise.all(validRows.map(row => {
        const receipt = receiptByOrderId.get(row.order.id);
        return supabaseOrdersApi.receiveOrder(receipt.nextOrder, { actualQty: row.actualQty, note })
          .then(result => ({ ...result, original: row, nextOrder: receipt.nextOrder }));
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
          setTxs(prev => [...receiptPlan.txs, ...prev]);
          setOrders(prev => prev.map(order => updatedOrders.get(order.id) || order));
          auditLogsApi.record({
            action: "order.bulk_received",
            entityType: "order",
            entityId: validRows.map(row => row.order.id).join(","),
            actor: currentUser,
            metadata: receiptPlan.auditMetadata,
            at: receivedAt,
          });
          setNotifs(prev => [receiptPlan.notification, ...prev]);
          showToast(receiptPlan.toast);
          setModal(null);
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.bulkReceive",
            userMessage: "묶음 입고 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setItems(prev => prev.map(item => qtyByItemId.has(item.id)
      ? { ...item, current_qty: item.current_qty + qtyByItemId.get(item.id) }
      : item
    ));

    setTxs(prev => [...receiptPlan.txs, ...prev]);

    setOrders(prev => prev.map(order => targetIds.has(order.id)
      ? receiptByOrderId.get(order.id).nextOrder
      : order
    ));

    auditLogsApi.record({
      action: "order.bulk_received",
      entityType: "order",
      entityId: validRows.map(row => row.order.id).join(","),
      actor: currentUser,
      metadata: receiptPlan.auditMetadata,
      at: receivedAt,
    });

    setNotifs(prev => [receiptPlan.notification, ...prev]);
    showToast(receiptPlan.toast);
    setModal(null);
  }, [currentUser, items, orders, setItems, setModal, setNotifs, setOrders, setTxs, showToast]);

  return useMemo(() => ({ confirmReceipt, confirmReceipts }), [confirmReceipt, confirmReceipts]);
}
