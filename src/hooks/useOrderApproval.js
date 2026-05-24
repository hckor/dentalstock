import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { ORDER_STATUS } from "../constants/orderStates";
import { can } from "../constants/permissions";
import { handleAppError } from "../utils/errorHandling";
import {
  buildApprovalAuditMetadata,
  buildApprovedOrder,
  buildBulkApprovalPlan,
  buildBulkOrderApprovedNotification,
  buildOrderApprovedNotification,
} from "../utils/orderApproval";
import {
  buildReviewAuditMetadata,
  buildReviewedOrder,
  buildReviewNotification,
  getReviewAuditAction,
  getReviewFailureToast,
  getReviewToast,
  resolveReviewStatus,
} from "../utils/orderRejection";
import { isOrderReviewable, isOrderStatus, isOrderTransitionAllowed } from "../utils/orderStateMachine";
import { buildVendorSnapshot, shouldUseSupabaseOrders } from "./orderActionShared";

export function useOrderApprovalActions({
  orders,
  setOrders,
  items,
  setNotifs,
  currentUser,
  showToast,
}) {
  const approveOrder = useCallback((orderId, reviewNote) => {
    if (!can(currentUser.role, "orders_approve_standard")) {
      showToast("승인 권한이 없습니다");
      return;
    }

    const order = orders.find(candidate => candidate.id === orderId);
    if (!order || !isOrderTransitionAllowed(order.status, ORDER_STATUS.ordered, { allowNoop: false })) {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }

    const item = items.find(candidate => candidate.id === order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }

    const reviewedAt = new Date().toISOString();
    const vendorSnapshot = buildVendorSnapshot(item, order.qty);
    const nextOrder = buildApprovedOrder({
      order,
      currentUserName: currentUser.name,
      reviewedAt,
      reviewNote,
      vendorSnapshot,
    });
    const auditMetadata = buildApprovalAuditMetadata({ item, order, reviewNote, vendorSnapshot });
    const approvedNotification = buildOrderApprovedNotification({ item, order, vendorSnapshot, createdAt: reviewedAt });

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.updateOrder(order, nextOrder, currentUser)
        .then(savedOrder => {
          setOrders(prev => prev.map(candidate => candidate.id === orderId ? savedOrder : candidate));
          auditLogsApi.record({
            action: "order.approved",
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: auditMetadata,
            at: reviewedAt,
          });
          setNotifs(prev => [approvedNotification, ...prev]);
          showToast("발주가 승인되었습니다.");
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.approve",
            userMessage: "발주 승인 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setOrders(prev => prev.map(candidate => candidate.id === orderId ? nextOrder : candidate));
    auditLogsApi.record({
      action: "order.approved",
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: auditMetadata,
      at: reviewedAt,
    });
    setNotifs(prev => [approvedNotification, ...prev]);
    showToast("발주가 승인되었습니다.");
  }, [currentUser, items, orders, setNotifs, setOrders, showToast]);

  const approveOrders = useCallback((orderIds, reviewNote = "일괄 승인") => {
    if (!can(currentUser.role, "orders_approve_standard")) {
      showToast("승인 권한이 없습니다");
      return;
    }

    const selectedIds = new Set(Array.isArray(orderIds) ? orderIds : []);
    const targetOrders = orders.filter(order => selectedIds.has(order.id) && isOrderStatus(order.status, ORDER_STATUS.pending));

    if (!targetOrders.length) {
      showToast("승인할 발주 요청이 없습니다");
      return;
    }

    const reviewedAt = new Date().toISOString();
    const approvalPlan = buildBulkApprovalPlan({
      targetOrders,
      items,
      currentUserName: currentUser.name,
      reviewedAt,
      reviewNote,
      buildVendorSnapshot,
    });
    const { nextOrders, vendorGroups, auditMetadata } = approvalPlan;

    if (shouldUseSupabaseOrders(currentUser)) {
      void Promise.all(nextOrders.map(order => supabaseOrdersApi.updateOrder(order, order, currentUser)))
        .then(savedOrders => {
          const savedById = new Map(savedOrders.map(order => [order.id, order]));
          setOrders(prev => prev.map(order => savedById.get(order.id) || order));
          auditLogsApi.record({
            action: "order.bulk_approved",
            entityType: "order",
            entityId: savedOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: { ...auditMetadata, count: savedOrders.length },
            at: reviewedAt,
          });
          setNotifs(prev => [buildBulkOrderApprovedNotification({ count: savedOrders.length, vendorGroupCount: vendorGroups.size, createdAt: reviewedAt }), ...prev]);
          showToast(`${savedOrders.length}건 일괄 승인 완료`);
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.bulkApprove",
            userMessage: "일괄 승인 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    const nextOrderById = new Map(nextOrders.map(order => [order.id, order]));
    setOrders(prev => prev.map(order => nextOrderById.get(order.id) || order));
    auditLogsApi.record({
      action: "order.bulk_approved",
      entityType: "order",
      entityId: targetOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: auditMetadata,
      at: reviewedAt,
    });
    setNotifs(prev => [buildBulkOrderApprovedNotification({ count: targetOrders.length, vendorGroupCount: vendorGroups.size, createdAt: reviewedAt }), ...prev]);
    showToast(`${targetOrders.length}건 일괄 승인 완료`);
  }, [currentUser, items, orders, setNotifs, setOrders, showToast]);

  const rejectOrder = useCallback((orderId, reviewNote, nextStatus = "rejected") => {
    const resolvedStatus = resolveReviewStatus(nextStatus);
    const isHold = resolvedStatus === "hold";
    if (!can(currentUser.role, isHold ? "orders_hold" : "orders_reject")) {
      showToast(isHold ? "보류 권한이 없습니다" : "거절 권한이 없습니다");
      return;
    }

    const order = orders.find(candidate => candidate.id === orderId);
    if (!order || !isOrderReviewable(order.status) || !isOrderTransitionAllowed(order.status, resolvedStatus)) {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }

    const item = items.find(candidate => candidate.id === order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }

    const reviewedAt = new Date().toISOString();
    const nextOrder = buildReviewedOrder({ order, resolvedStatus, currentUserName: currentUser.name, reviewedAt, reviewNote });
    const auditMetadata = buildReviewAuditMetadata({ item, order, reviewNote });
    const notification = buildReviewNotification({ item, currentUserName: currentUser.name, reviewNote, isHold, createdAt: reviewedAt });

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.updateOrder(order, nextOrder, currentUser)
        .then(savedOrder => {
          setOrders(prev => prev.map(candidate => candidate.id === orderId ? savedOrder : candidate));
          auditLogsApi.record({
            action: getReviewAuditAction(isHold),
            entityType: "order",
            entityId: savedOrder.id,
            actor: currentUser,
            metadata: auditMetadata,
            at: reviewedAt,
          });
          setNotifs(prev => [notification, ...prev]);
          showToast(getReviewToast(isHold));
        })
        .catch(error => {
          handleAppError(error, {
            context: isHold ? "orders.hold" : "orders.reject",
            userMessage: getReviewFailureToast(isHold),
            showToast,
          });
        });
      return;
    }

    setOrders(prev => prev.map(candidate => candidate.id === orderId ? nextOrder : candidate));
    auditLogsApi.record({
      action: getReviewAuditAction(isHold),
      entityType: "order",
      entityId: orderId,
      actor: currentUser,
      metadata: auditMetadata,
      at: reviewedAt,
    });
    setNotifs(prev => [notification, ...prev]);
    showToast(getReviewToast(isHold));
  }, [currentUser, items, orders, setNotifs, setOrders, showToast]);

  return useMemo(() => ({ approveOrder, approveOrders, rejectOrder }), [approveOrder, approveOrders, rejectOrder]);
}
