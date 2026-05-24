import { describe, expect, it } from "vitest";
import {
  buildTrackingDeliveredNotification,
  buildTrackingRefreshPlan,
  buildTrackingRefreshToast,
  buildTrackingRegisteredNotification,
  buildTrackingRegisteredToast,
  buildTrackingRegistrationPlan,
  getLocalNextTrackingEvent,
  getShipmentPeerOrders,
  getStoredShippingEvents,
  getTrackingRefreshRequest,
  mergeSavedTrackingOrders,
} from "../utils/orderTracking";

const orders = [
  {
    id: "o1",
    item_id: "i1",
    qty: 5,
    status: "ordered",
    requested_at: "2026-05-01T10:00:00Z",
    reviewed_at: "2026-05-01T11:00:00Z",
    reviewed_by: "이매니저",
    review_note: "일괄 승인",
    vendor_id: "v1",
  },
  {
    id: "o2",
    item_id: "i2",
    qty: 2,
    status: "ordered",
    requested_at: "2026-05-01T10:00:00Z",
    reviewed_at: "2026-05-01T11:00:00Z",
    reviewed_by: "이매니저",
    review_note: "일괄 승인",
    vendor_id: "v1",
  },
  {
    id: "o3",
    item_id: "i3",
    qty: 1,
    status: "pending",
    reviewed_at: "2026-05-01T11:00:00Z",
    reviewed_by: "이매니저",
    review_note: "일괄 승인",
    vendor_id: "v1",
  },
];

describe("order tracking utilities", () => {
  it("저장된 배송 이벤트 소스와 묶음 배송 대상을 계산한다", () => {
    expect(getStoredShippingEvents({ shipping_timeline: [{ status: "배송중" }] })).toEqual([{ status: "배송중" }]);

    expect(getShipmentPeerOrders({ ...orders[0], shipment_group_id: "sg1" }, [
      { ...orders[0], shipment_group_id: "sg1" },
      { ...orders[1], shipment_group_id: "sg1" },
      { ...orders[2], shipment_group_id: "sg1" },
    ]).map(order => order.id)).toEqual(["o1", "o2"]);

    expect(getShipmentPeerOrders(orders[0], orders).map(order => order.id)).toEqual(["o1", "o2"]);
  });

  it("송장 등록 계획, 알림, 토스트를 만든다", () => {
    const plan = buildTrackingRegistrationPlan({
      order: orders[0],
      orders,
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      trackingStartedAt: "2026-05-02T09:00:00Z",
    });

    expect(plan.targetIds.has("o1")).toBe(true);
    expect(plan.nextOrders).toHaveLength(2);
    expect(plan.nextOrders[0]).toMatchObject({
      carrier: "CJ대한통운",
      tracking_number: "1234567890",
    });
    expect(plan.nextOrders[0].shipping_events[0]).toMatchObject({ status: "배송중", location: "CJ대한통운" });
    expect(plan.auditMetadata).toMatchObject({ order_count: 2, tracking_number_last4: "7890" });
    expect(buildTrackingRegisteredNotification({
      item: { id: "i1", name: "거즈" },
      targetCount: 2,
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      createdAt: "now",
    })).toMatchObject({ message: "묶음 배송 2건 송장이 등록됐습니다", sub: "CJ대한통운 · 1234567890" });
    expect(buildTrackingRegisteredToast(2)).toBe("2건 묶음 송장이 등록됐습니다");
  });

  it("배송 갱신 요청과 로컬 다음 이벤트를 만든다", () => {
    const order = {
      ...orders[0],
      carrier: "CJ대한통운",
      tracking_number: "1234567890",
      shipping_events: [{ status: "배송중" }],
    };

    expect(getTrackingRefreshRequest(order)).toEqual({
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      currentStatuses: ["배송중"],
    });
    expect(getLocalNextTrackingEvent(order, "now")).toMatchObject({
      status: "배송출발",
      timestamp: "now",
    });
  });

  it("배송 갱신 계획과 배달완료 알림을 만든다", () => {
    const order = {
      ...orders[0],
      carrier: "CJ대한통운",
      tracking_number: "1234567890",
      shipping_events: [{ status: "배송출발" }],
    };
    const plan = buildTrackingRefreshPlan({
      order,
      orders: [order],
      nextEvent: { status: "배달완료", timestamp: "now", location: "치과 접수대", completed: true },
      refreshedAt: "now",
    });

    expect(plan.isDelivered).toBe(true);
    expect(plan.auditAction).toBe("order.delivered");
    expect(plan.nextOrders[0].delivery_completed_at).toBe("now");
    expect(plan.nextOrders[0].shipping_events[0]).toMatchObject({ status: "배달완료" });
    expect(plan.auditMetadata).toMatchObject({ shipping_status: "배달완료", tracking_number_last4: "7890" });
    expect(buildTrackingDeliveredNotification({
      item: { id: "i1", name: "거즈" },
      targetCount: 1,
      createdAt: "now",
    })).toMatchObject({ type: "delivered", message: "거즈 배달완료" });
    expect(buildTrackingRefreshToast({ isDelivered: true, hasItem: true })).toBe("배달완료 알림이 생성되었습니다");
  });

  it("Supabase 저장 결과와 로컬 배송 이벤트를 병합한다", () => {
    const savedById = mergeSavedTrackingOrders(
      [{ id: "o1", status: "ordered", shipping_events: [] }],
      [{ id: "o1", shipping_events: [{ status: "배송출발" }], delivery_completed_at: "now" }],
      { includeDeliveryCompletedAt: true }
    );

    expect(savedById.get("o1")).toMatchObject({
      delivery_completed_at: "now",
      shipping_events: [{ status: "배송출발" }],
    });
  });
});
