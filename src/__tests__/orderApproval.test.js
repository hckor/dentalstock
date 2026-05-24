import { describe, expect, it } from "vitest";
import {
  buildApprovalAuditMetadata,
  buildApprovedOrder,
  buildBulkApprovalPlan,
  buildBulkOrderApprovedNotification,
  buildOrderApprovedNotification,
} from "../utils/orderApproval";

const items = [
  { id: "i1", name: "거즈", unit: "박스" },
  { id: "i2", name: "면봉", unit: "상자" },
  { id: "i3", name: "마스크", unit: "박스" },
];

const orders = [
  { id: "o1", item_id: "i1", qty: 2, status: "pending" },
  { id: "o2", item_id: "i2", qty: 3, status: "pending" },
  { id: "o3", item_id: "i3", qty: 4, status: "pending" },
];

const vendorByItemId = {
  i1: { vendor_id: "v1", vendor_name: "덴올", vendor_price: 1000 },
  i2: { vendor_id: "v2", vendor_name: "오스템몰", vendor_price: 900 },
  i3: { vendor_id: "v1", vendor_name: "덴올", vendor_price: 800 },
};

describe("order approval utilities", () => {
  it("단건 승인 발주와 감사로그 payload를 만든다", () => {
    const approved = buildApprovedOrder({
      order: orders[0],
      currentUserName: "이매니저",
      reviewedAt: "2026-05-25T11:00:00.000Z",
      reviewNote: "승인",
      vendorSnapshot: vendorByItemId.i1,
    });

    expect(approved).toMatchObject({
      id: "o1",
      status: "ordered",
      reviewed_by: "이매니저",
      reviewed_at: "2026-05-25T11:00:00.000Z",
      review_note: "승인",
      vendor_id: "v1",
      vendor_name: "덴올",
    });
    expect(buildApprovalAuditMetadata({
      item: items[0],
      order: orders[0],
      reviewNote: "승인",
      vendorSnapshot: vendorByItemId.i1,
    })).toEqual({
      item_id: "i1",
      item_name: "거즈",
      qty: 2,
      review_note: "승인",
      vendor_id: "v1",
      vendor_name: "덴올",
    });
  });

  it("일괄 승인 시 같은 거래처 발주는 배송 묶음을 만든다", () => {
    const plan = buildBulkApprovalPlan({
      targetOrders: orders,
      items,
      currentUserName: "이매니저",
      reviewedAt: "2026-05-25T11:00:00.000Z",
      reviewNote: "일괄 승인",
      buildVendorSnapshot: (item) => vendorByItemId[item.id],
      createShipmentGroupId: (index) => `sg-fixed-${index}`,
    });

    expect(plan.nextOrders).toHaveLength(3);
    expect(plan.nextOrders.find(order => order.id === "o1")).toMatchObject({ status: "ordered", shipment_group_id: "sg-fixed-0" });
    expect(plan.nextOrders.find(order => order.id === "o2")).toMatchObject({ status: "ordered", shipment_group_id: undefined });
    expect(plan.nextOrders.find(order => order.id === "o3")).toMatchObject({ status: "ordered", shipment_group_id: "sg-fixed-0" });
    expect(plan.auditMetadata).toEqual({
      count: 3,
      orders: "거즈:2박스@덴올, 면봉:3상자@오스템몰, 마스크:4박스@덴올",
      review_note: "일괄 승인",
    });
  });

  it("승인 알림 payload를 만든다", () => {
    expect(buildOrderApprovedNotification({
      item: items[0],
      order: orders[0],
      vendorSnapshot: vendorByItemId.i1,
      createdAt: "now",
    })).toMatchObject({
      type: "ordered",
      item_id: "i1",
      message: "거즈 발주가 완료되었습니다",
      sub: "덴올 · 2박스 배송 대기",
      created_at: "now",
    });
    expect(buildBulkOrderApprovedNotification({
      count: 3,
      vendorGroupCount: 2,
      createdAt: "now",
    })).toMatchObject({
      type: "ordered",
      item_id: null,
      message: "발주 3건이 승인되었습니다",
      sub: "2개 거래처로 나눠 배송",
    });
  });
});
