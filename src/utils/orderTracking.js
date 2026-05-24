import {
  addShippingProgressEvent,
  buildInitialShippingEvents,
  getNextShippingProgressEvent,
} from "./shippingEvents";
import { getOrderVendorKey } from "./vendorSelection";

export function getStoredShippingEvents(order) {
  if (Array.isArray(order?.shipping_events)) return order.shipping_events;
  if (Array.isArray(order?.shipping_timeline)) return order.shipping_timeline;
  return [];
}

export function getShipmentPeerOrders(order, orders) {
  if (!order) return [];

  if (order.shipment_group_id) {
    return orders.filter(candidate =>
      candidate.shipment_group_id === order.shipment_group_id &&
      candidate.status === "ordered"
    );
  }

  const vendorKey = getOrderVendorKey(order);
  if (order.review_note === "일괄 승인" && order.reviewed_at) {
    return orders.filter(candidate =>
      candidate.status === "ordered" &&
      candidate.review_note === "일괄 승인" &&
      candidate.reviewed_at === order.reviewed_at &&
      candidate.reviewed_by === order.reviewed_by &&
      getOrderVendorKey(candidate) === vendorKey
    );
  }

  return [order];
}

export function buildTrackingAuditMetadata({ order, targetCount, carrier, trackingNumber, shippingStatus }) {
  return {
    item_id: order.item_id,
    order_count: targetCount,
    shipment_group_id: order.shipment_group_id || "",
    carrier: carrier || "",
    tracking_number_last4: String(trackingNumber || "").slice(-4),
    ...(shippingStatus ? { shipping_status: shippingStatus } : {}),
  };
}

export function buildTrackingRegistrationPlan({
  order,
  orders,
  carrier,
  trackingNumber,
  trackingStartedAt,
}) {
  const targetOrders = getShipmentPeerOrders(order, orders);
  const targetIds = new Set(targetOrders.map(candidate => candidate.id));
  const nextOrders = targetOrders.map(candidate => ({
    ...candidate,
    carrier,
    tracking_number: trackingNumber,
    shipping_events: buildInitialShippingEvents({
      order: candidate,
      carrier,
      timestamp: trackingStartedAt,
    }),
  }));

  return {
    targetOrders,
    targetIds,
    nextOrders,
    auditMetadata: buildTrackingAuditMetadata({
      order,
      targetCount: targetOrders.length,
      carrier,
      trackingNumber,
    }),
  };
}

export function buildTrackingRegisteredNotification({ item, targetCount, carrier, trackingNumber, createdAt }) {
  if (!item) return null;
  return {
    id: `n${Date.now()}`,
    type: "ordered",
    item_id: item.id,
    message: targetCount > 1 ? `묶음 배송 ${targetCount}건 송장이 등록됐습니다` : `${item.name} 송장이 등록됐습니다`,
    sub: `${carrier} · ${trackingNumber}`,
    is_read: false,
    created_at: createdAt,
  };
}

export function buildTrackingRegisteredToast(targetCount) {
  return targetCount > 1 ? `${targetCount}건 묶음 송장이 등록됐습니다` : "송장이 등록됐습니다";
}

export function getTrackingRefreshRequest(order) {
  return {
    carrier: order.carrier,
    trackingNumber: order.tracking_number,
    currentStatuses: getStoredShippingEvents(order).map(event => event.status).filter(Boolean),
  };
}

export function getLocalNextTrackingEvent(order, refreshedAt) {
  return getNextShippingProgressEvent(order, refreshedAt);
}

export function buildTrackingRefreshPlan({ order, orders, nextEvent, refreshedAt }) {
  const targetOrders = getShipmentPeerOrders(order, orders);
  const targetIds = new Set(targetOrders.map(candidate => candidate.id));
  const isDelivered = nextEvent?.status === "배달완료";
  const nextOrders = targetOrders.map(candidate => ({
    ...candidate,
    delivery_completed_at: isDelivered ? refreshedAt : candidate.delivery_completed_at,
    shipping_events: addShippingProgressEvent(candidate, nextEvent),
  }));

  return {
    targetOrders,
    targetIds,
    nextOrders,
    isDelivered,
    auditAction: isDelivered ? "order.delivered" : "order.tracking_refreshed",
    auditMetadata: buildTrackingAuditMetadata({
      order,
      targetCount: targetOrders.length,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      shippingStatus: nextEvent?.status,
    }),
  };
}

export function buildTrackingDeliveredNotification({ item, targetCount, createdAt }) {
  if (!item) return null;
  return {
    id: `n${Date.now()}`,
    type: "delivered",
    item_id: item.id,
    message: targetCount > 1 ? `묶음 배송 ${targetCount}건 배달완료` : `${item.name} 배달완료`,
    sub: "입고 확인이 필요합니다",
    is_read: false,
    created_at: createdAt,
  };
}

export function buildTrackingRefreshToast({ isDelivered, hasItem }) {
  return isDelivered && hasItem ? "배달완료 알림이 생성되었습니다" : "배송 상태가 갱신되었습니다";
}

export function mergeSavedTrackingOrders(savedOrders, nextOrders, { includeDeliveryCompletedAt = false } = {}) {
  return new Map(savedOrders.map(savedOrder => {
    const nextOrder = nextOrders.find(candidate => candidate.id === savedOrder.id);
    return [savedOrder.id, {
      ...savedOrder,
      ...(includeDeliveryCompletedAt ? { delivery_completed_at: nextOrder?.delivery_completed_at } : {}),
      shipping_events: nextOrder?.shipping_events || savedOrder.shipping_events,
    }];
  }));
}
