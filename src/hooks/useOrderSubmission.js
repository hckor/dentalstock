import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { getActiveOrder } from "../utils/helpers";
import { handleAppError } from "../utils/errorHandling";
import {
  buildBulkOrderRequestAuditMetadata,
  buildBulkOrderRequestNotification,
  buildOrderRequest,
  buildOrderRequestAuditMetadata,
  buildOrderRequestNotification,
  buildOrderRequestToast,
  getAvailableOrderRequests,
  normalizeOrderRequests,
} from "../utils/orderSubmission";
import { buildVendorSnapshot, shouldUseSupabaseOrders } from "./orderActionShared";

export function useOrderSubmissionActions({
  orders,
  setOrders,
  setNotifs,
  currentUser,
  showToast,
  setModal,
}) {
  const submitOrder = useCallback((item, qty, note) => {
    if (getActiveOrder(orders, item.id)) {
      showToast("이미 진행 중인 발주가 있습니다.");
      setModal(null);
      return;
    }

    const now = new Date().toISOString();
    const vendorSnapshot = buildVendorSnapshot(item, qty);
    const newOrder = buildOrderRequest({
      item,
      qty,
      note,
      requestedBy: currentUser.name,
      requestedAt: now,
      id: `o${Date.now()}`,
      vendorSnapshot,
    });
    const requestNotification = buildOrderRequestNotification({ item, qty, userName: currentUser.name, createdAt: now });
    const auditMetadata = buildOrderRequestAuditMetadata({ item, qty, note, vendorSnapshot });

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.createOrder(currentUser.clinicId, newOrder, currentUser)
        .then(savedOrder => {
          setOrders(prev => [savedOrder, ...prev]);
          auditLogsApi.record({
            action: "order.requested",
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: auditMetadata,
            at: now,
          });
          setNotifs(prev => [requestNotification, ...prev]);
          showToast(buildOrderRequestToast({ item }));
          setModal(null);
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.submit",
            userMessage: "발주 요청 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setOrders(prev => [newOrder, ...prev]);
    auditLogsApi.record({
      action: "order.requested",
      entityType: "order",
      entityId: newOrder.id,
      actor: currentUser,
      metadata: auditMetadata,
      at: now,
    });
    setNotifs(prev => [requestNotification, ...prev]);
    showToast(buildOrderRequestToast({ item }));
    setModal(null);
  }, [currentUser, orders, setModal, setNotifs, setOrders, showToast]);

  const submitBulkOrders = useCallback((orderItems, note = "") => {
    const requests = normalizeOrderRequests(orderItems);
    const { availableRequests, skippedCount } = getAvailableOrderRequests(requests, orders);

    if (!availableRequests.length) {
      showToast(skippedCount > 0 ? "이미 발주 중인 품목만 있습니다" : "발주 요청할 품목이 없습니다");
      return;
    }

    const now = new Date().toISOString();
    const newOrders = availableRequests.map(({ item, qty }, index) => buildOrderRequest({
      item,
      qty,
      note,
      requestedBy: currentUser.name,
      requestedAt: now,
      id: `o${Date.now()}-${index}`,
      vendorSnapshot: buildVendorSnapshot(item, qty),
    }));
    const bulkAuditMetadata = buildBulkOrderRequestAuditMetadata({ requests: availableRequests, skippedCount, note });

    if (shouldUseSupabaseOrders(currentUser)) {
      void Promise.all(newOrders.map(order => supabaseOrdersApi.createOrder(currentUser.clinicId, order, currentUser)))
        .then(savedOrders => {
          setOrders(prev => [...savedOrders, ...prev]);
          auditLogsApi.record({
            action: "order.bulk_requested",
            entityType: "order",
            entityId: savedOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: { ...bulkAuditMetadata, count: savedOrders.length },
            at: now,
          });
          setNotifs(prev => [buildBulkOrderRequestNotification({ count: savedOrders.length, skippedCount, userName: currentUser.name, createdAt: now }), ...prev]);
          showToast(buildOrderRequestToast({ count: savedOrders.length, skippedCount }));
          setModal(null);
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.bulkSubmit",
            userMessage: "일괄 발주 요청 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setOrders(prev => [...newOrders, ...prev]);
    auditLogsApi.record({
      action: "order.bulk_requested",
      entityType: "order",
      entityId: newOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: bulkAuditMetadata,
      at: now,
    });
    setNotifs(prev => [buildBulkOrderRequestNotification({ count: newOrders.length, skippedCount, userName: currentUser.name, createdAt: now }), ...prev]);
    showToast(buildOrderRequestToast({ count: newOrders.length, skippedCount }));
    setModal(null);
  }, [currentUser, orders, setModal, setNotifs, setOrders, showToast]);

  return useMemo(() => ({ submitOrder, submitBulkOrders }), [submitBulkOrders, submitOrder]);
}
