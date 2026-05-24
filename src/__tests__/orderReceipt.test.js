import { describe, expect, it } from "vitest";
import {
  buildBulkReceiptPlan,
  buildReceiptAuditMetadata,
  buildReceiptNotification,
  buildReceiptState,
  buildReceiptToast,
  buildReceiptTx,
  getValidReceiptRows,
  normalizeReceiptRows,
} from "../utils/orderReceipt";

const items = [
  { id: "i1", name: "거즈", unit: "박스", current_qty: 10 },
  { id: "i2", name: "면봉", unit: "상자", current_qty: 20 },
];

const orders = [
  { id: "o1", item_id: "i1", qty: 5, status: "ordered", requested_by: "김원장" },
  { id: "o2", item_id: "i2", qty: 8, status: "ordered", requested_by: "박원장" },
  { id: "o3", item_id: "i1", qty: 3, status: "pending", requested_by: "김원장" },
];

describe("order receipt utilities", () => {
  it("입고 입력을 정규화하고 유효한 ordered 주문만 남긴다", () => {
    expect(normalizeReceiptRows([
      { orderId: "o1", actualQty: "5" },
      { orderId: "o2", actualQty: 0 },
      { orderId: "", actualQty: 1 },
      { orderId: "o3", actualQty: "x" },
    ])).toEqual([{ orderId: "o1", actualQty: 5 }]);

    expect(getValidReceiptRows([
      { orderId: "o1", actualQty: 5 },
      { orderId: "o3", actualQty: 3 },
    ], orders, items).map(row => row.order.id)).toEqual(["o1"]);
  });

  it("단건 입고 상태/입출고/감사로그/알림 payload를 만든다", () => {
    const state = buildReceiptState({ order: orders[0], actualQty: 3, receivedAt: "now" });

    expect(state).toMatchObject({
      totalReceived: 3,
      isFullyReceived: false,
      nextOrder: { status: "ordered", received_qty: 3, partial_received_at: "now" },
    });
    expect(state.nextOrder.shipping_events[0].status).toBe("부분입고");
    expect(buildReceiptTx({
      order: orders[0],
      item: items[0],
      actualQty: 3,
      note: "나머지 대기",
      currentUserName: "이매니저",
      receivedAt: "now",
      id: "t1",
    })).toMatchObject({
      id: "t1",
      type: "in",
      qty: 3,
      note: "발주 입고 확인 (요청자: 김원장) · 나머지 대기",
      user: "이매니저",
    });
    expect(buildReceiptAuditMetadata({
      item: items[0],
      order: orders[0],
      actualQty: 3,
      totalReceived: 3,
      beforeQty: 10,
      afterQty: 13,
      note: "",
    })).toMatchObject({
      ordered_qty: 5,
      received_qty: 3,
      total_received_qty: 3,
      remaining_qty: 2,
      before_qty: 10,
      after_qty: 13,
    });
    expect(buildReceiptNotification({
      item: items[0],
      actualQty: 3,
      currentUserName: "이매니저",
      isFullyReceived: false,
      createdAt: "now",
    })).toMatchObject({
      type: "received",
      message: "거즈 부분 입고 확인",
      sub: "이매니저 확인 · 3박스 입고",
    });
    expect(buildReceiptToast({ item: items[0], actualQty: 3, isFullyReceived: false })).toBe("3박스 부분 입고 확인");
  });

  it("묶음 입고 계획을 만든다", () => {
    const plan = buildBulkReceiptPlan({
      receipts: [
        { orderId: "o1", actualQty: 5 },
        { orderId: "o2", actualQty: 4 },
      ],
      orders,
      items,
      note: "확인",
      currentUserName: "이매니저",
      receivedAt: "now",
    });

    expect(plan.validRows).toHaveLength(2);
    expect(plan.qtyByItemId.get("i1")).toBe(5);
    expect(plan.qtyByItemId.get("i2")).toBe(4);
    expect(plan.receiptByOrderId.get("o1")).toMatchObject({ isFullyReceived: true, totalReceived: 5 });
    expect(plan.receiptByOrderId.get("o2")).toMatchObject({ isFullyReceived: false, totalReceived: 4 });
    expect(plan.txs.map(tx => tx.qty)).toEqual([5, 4]);
    expect(plan.auditMetadata).toMatchObject({ count: 2, completed_count: 1, partial_count: 1 });
    expect(plan.notification).toMatchObject({ message: "묶음 배송 2건 수량 확인", sub: "완료 1건 · 부분입고 1건" });
    expect(plan.toast).toBe("완료 1건 · 부분입고 1건");
  });
});
