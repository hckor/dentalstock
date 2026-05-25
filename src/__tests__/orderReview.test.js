import { describe, expect, it } from "vitest";
import {
  getMonthlyProjectedAmounts,
  getOrderApprovalGate,
  getOrderAmount,
  getOrderDuplicateInfo,
  getOrderUnitPrice,
  getPendingSummary,
} from "../utils/orderReview";

const item = {
  id: "i1",
  name: "임플란트 키트",
  price: 120000,
  current_qty: 1,
  min_qty: 2,
  vendor_options: [
    { vendor_id: "a", price: 90000, shipping_fee: 10000, min_order_qty: 1 },
    { vendor_id: "b", price: 110000, shipping_fee: 0, min_order_qty: 1 },
  ],
};

describe("order review utilities", () => {
  it("저장된 발주 단가를 우선하고 없으면 거래처 실효가를 사용한다", () => {
    expect(getOrderUnitPrice({ vendor_price: 85000, qty: 1 }, item)).toBe(85000);
    expect(getOrderUnitPrice({ qty: 2 }, item)).toBe(95000);
    expect(getOrderAmount({ qty: 2 }, item)).toBe(190000);
  });

  it("같은 품목의 대기/입고대기 발주 중복 정보를 계산한다", () => {
    const order = { id: "o1", item_id: "i1", qty: 1, status: "pending" };
    const duplicate = getOrderDuplicateInfo(order, [
      order,
      { id: "o2", item_id: "i1", qty: 3, status: "pending" },
      { id: "o3", item_id: "i1", qty: 2, status: "ordered" },
      { id: "o4", item_id: "i1", qty: 5, status: "received" },
      { id: "o5", item_id: "other", qty: 9, status: "pending" },
    ]);

    expect(duplicate).toEqual({
      pendingCount: 1,
      pendingQty: 3,
      orderedCount: 1,
      orderedQty: 2,
      hasDuplicate: true,
    });
  });

  it("가격 후보, 중복, 1회/월 기준으로 원장 승인 사유를 만든다", () => {
    const gate = getOrderApprovalGate(
      { id: "o1", item_id: "i1", qty: 2 },
      item,
      { hasDuplicate: true },
      600000
    );

    expect(gate.requiresOwnerApproval).toBe(true);
    expect(gate.reasons).toEqual(["1회 10만원 이상", "중복 발주", "월 50만원 초과 가능"]);
  });

  it("가격 후보가 없는 발주는 원장 검토 사유를 만든다", () => {
    const gate = getOrderApprovalGate(
      { id: "o1", item_id: "empty", qty: 1 },
      { id: "empty", name: "가격 없음", price: 0, vendor_options: [] },
      null,
      0
    );

    expect(gate.reasons).toContain("가격 후보 없음");
  });

  it("월별 예상 금액과 대기 요약을 계산한다", () => {
    const orders = [
      { id: "o1", item_id: "i1", qty: 1, status: "pending", requested_at: "2026-05-01T09:00:00" },
      { id: "o2", item_id: "i1", qty: 2, status: "ordered", requested_at: "2026-05-02T09:00:00" },
      { id: "o3", item_id: "i1", qty: 1, status: "rejected", requested_at: "2026-05-03T09:00:00" },
    ];

    expect(getMonthlyProjectedAmounts(orders, [item])).toEqual({
      o1: 290000,
      o2: 290000,
      o3: 290000,
    });
    expect(getPendingSummary([orders[0]], [item])).toMatchObject({
      amount: 100000,
      stockRisk: 1,
      savings: 10000,
    });
  });
});
