import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { ORDER_STATUS } from "../constants/orderStates";
import { can } from "../constants/permissions";
import { handleAppError } from "../utils/errorHandling";
import { isOrderStatus } from "../utils/orderStateMachine";
import {
  buildTrackingDeliveredNotification,
  buildTrackingRefreshPlan,
  buildTrackingRefreshToast,
  buildTrackingRegisteredNotification,
  buildTrackingRegisteredToast,
  buildTrackingRegistrationPlan,
  getLocalNextTrackingEvent,
  getTrackingRefreshRequest,
  mergeSavedTrackingOrders,
} from "../utils/orderTracking";
import { shouldUseSupabaseOrders } from "./orderActionShared";

export function useOrderTrackingActions({
  orders,
  setOrders,
  items,
  setNotifs,
  currentUser,
  showToast,
  repositoryAdapter,
  trackingClient,
}) {
  const startTracking = useCallback((orderId, carrier, trackingNumber) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("송장 등록 권한이 없습니다");
      return;
    }

    const order = orders.find(candidate => candidate.id === orderId);
    if (!order || !isOrderStatus(order.status, ORDER_STATUS.ordered)) {
      showToast("송장 등록할 주문을 찾을 수 없습니다.");
      return;
    }

    const item = items.find(candidate => candidate.id === order.item_id);
    const trackingStartedAt = new Date().toISOString();
    const trackingPlan = buildTrackingRegistrationPlan({
      order,
      orders,
      carrier,
      trackingNumber,
      trackingStartedAt,
    });
    const { targetOrders, targetIds, nextOrders } = trackingPlan;

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.updateOrders(nextOrders, currentUser)
        .then(savedOrders => {
          const savedById = mergeSavedTrackingOrders(savedOrders, nextOrders);
          setOrders(prev => prev.map(order => savedById.get(order.id) || order));
          auditLogsApi.record({
            action: "order.tracking_registered",
            entityType: "order",
            entityId: targetOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: trackingPlan.auditMetadata,
            at: trackingStartedAt,
          });
          const notification = buildTrackingRegisteredNotification({
            item,
            targetCount: targetOrders.length,
            carrier,
            trackingNumber,
            createdAt: new Date().toISOString(),
          });
          if (notification) {
            setNotifs(prev => [notification, ...prev]);
          }
          showToast(buildTrackingRegisteredToast(targetOrders.length));
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.tracking.register",
            userMessage: "송장 등록 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setOrders(prev => prev.map(order => targetIds.has(order.id)
      ? nextOrders.find(nextOrder => nextOrder.id === order.id) || order
      : order
    ));
    auditLogsApi.record({
      action: "order.tracking_registered",
      entityType: "order",
      entityId: targetOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: trackingPlan.auditMetadata,
      at: trackingStartedAt,
    });
    const notification = buildTrackingRegisteredNotification({
      item,
      targetCount: targetOrders.length,
      carrier,
      trackingNumber,
      createdAt: new Date().toISOString(),
    });
    if (notification) {
      setNotifs(prev => [notification, ...prev]);
    }
    showToast(buildTrackingRegisteredToast(targetOrders.length));
  }, [currentUser, items, orders, setNotifs, setOrders, showToast]);

  const refreshTracking = useCallback(async (orderId) => {
    if (!can(currentUser.role, "orders_approve")) {
      showToast("배송 갱신 권한이 없습니다");
      return;
    }

    const order = orders.find(candidate => candidate.id === orderId);
    if (!order || !isOrderStatus(order.status, ORDER_STATUS.ordered) || !order.tracking_number) {
      showToast("갱신할 송장 정보를 찾을 수 없습니다.");
      return;
    }

    const item = items.find(candidate => candidate.id === order.item_id);
    const refreshedAt = new Date().toISOString();
    let nextEvent;

    if (repositoryAdapter.isRemoteEnabled) {
      try {
        const tracking = await trackingClient.refreshTracking(getTrackingRefreshRequest(order));
        nextEvent = tracking?.events?.[0] || null;
      } catch (error) {
        handleAppError(error, {
          context: "orders.tracking.fetch",
          userMessage: "배송 조회 서버에 연결할 수 없습니다",
          showToast,
        });
        return;
      }
    } else {
      nextEvent = getLocalNextTrackingEvent(order, refreshedAt);
    }

    if (!nextEvent) {
      showToast("이미 최신 배송 상태입니다");
      return;
    }

    const trackingPlan = buildTrackingRefreshPlan({ order, orders, nextEvent, refreshedAt });
    const { targetOrders, targetIds, nextOrders } = trackingPlan;

    if (shouldUseSupabaseOrders(currentUser)) {
      void supabaseOrdersApi.updateOrders(nextOrders, currentUser)
        .then(savedOrders => {
          const savedById = mergeSavedTrackingOrders(savedOrders, nextOrders, { includeDeliveryCompletedAt: true });
          setOrders(prev => prev.map(order => savedById.get(order.id) || order));
          auditLogsApi.record({
            action: trackingPlan.auditAction,
            entityType: "order",
            entityId: targetOrders.map(order => order.id).join(","),
            actor: currentUser,
            metadata: trackingPlan.auditMetadata,
            at: refreshedAt,
          });
          const notification = trackingPlan.isDelivered
            ? buildTrackingDeliveredNotification({ item, targetCount: targetOrders.length, createdAt: refreshedAt })
            : null;
          if (notification) {
            setNotifs(prev => [notification, ...prev]);
            showToast(buildTrackingRefreshToast({ isDelivered: trackingPlan.isDelivered, hasItem: Boolean(item) }));
            return;
          }
          showToast(buildTrackingRefreshToast({ isDelivered: trackingPlan.isDelivered, hasItem: Boolean(item) }));
        })
        .catch(error => {
          handleAppError(error, {
            context: "orders.tracking.refresh",
            userMessage: "배송 상태 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setOrders(prev => prev.map(order => targetIds.has(order.id)
      ? nextOrders.find(nextOrder => nextOrder.id === order.id) || order
      : order
    ));

    auditLogsApi.record({
      action: trackingPlan.auditAction,
      entityType: "order",
      entityId: targetOrders.map(order => order.id).join(","),
      actor: currentUser,
      metadata: trackingPlan.auditMetadata,
      at: refreshedAt,
    });

    const notification = trackingPlan.isDelivered
      ? buildTrackingDeliveredNotification({ item, targetCount: targetOrders.length, createdAt: refreshedAt })
      : null;
    if (notification) {
      setNotifs(prev => [notification, ...prev]);
      showToast(buildTrackingRefreshToast({ isDelivered: trackingPlan.isDelivered, hasItem: Boolean(item) }));
      return;
    }

    showToast(buildTrackingRefreshToast({ isDelivered: trackingPlan.isDelivered, hasItem: Boolean(item) }));
  }, [currentUser, items, orders, repositoryAdapter, setNotifs, setOrders, showToast, trackingClient]);

  return useMemo(() => ({ startTracking, refreshTracking }), [refreshTracking, startTracking]);
}
