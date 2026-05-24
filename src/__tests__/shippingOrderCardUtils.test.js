import { describe, expect, it, vi } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  getApprovalDecision,
  getDuplicateReviewSignal,
  getPriceReviewSignal,
  getSelectedUnitPrice,
} from "../components/shared/ShippingOrderCard/shippingOrderCard.utils";

describe("ShippingOrderCard pure utilities", () => {
  it("금액 포맷과 선택 단가 fallback을 계산한다", () => {
    const item = {
      price: 12000,
      vendor_options: [
        { vendor_id: "v1", price: 9000, shipping_fee: 3000, min_order_qty: 3, in_stock: true },
      ],
    };

    expect(formatCurrency("12345")).toBe("12,345원");
    expect(formatCurrency("bad")).toBe("가격 미확인");
    expect(formatCompactCurrency(15500)).toBe("2만원");
    expect(formatCompactCurrency(9500)).toBe("9,500원");
    expect(getSelectedUnitPrice({ qty: 2, vendor_price: 8000 }, item)).toBe(8000);
    expect(getSelectedUnitPrice({ qty: 2 }, item)).toBe(10000);
    expect(getSelectedUnitPrice({ qty: 2 }, { price: 7000, vendor_options: [] })).toBe(7000);
  });

  it("가격 후보 상태별 승인 검토 신호를 만든다", () => {
    expect(getPriceReviewSignal({ qty: 1 }, { vendor_options: [] })).toMatchObject({
      needsReview: true,
      label: "가격 후보 없음",
      nextAction: "후보 URL/거래처 등록 후 승인 검토",
    });

    expect(getPriceReviewSignal({ qty: 1 }, {
      vendor_options: [
        { vendor_id: "v1", price: 1000, url: "https://vendor.example/item" },
      ],
    })).toMatchObject({
      needsReview: true,
      label: "실시간 가격 미확인",
      nextAction: "가격 확인 버튼을 눌러 최신가 확인",
    });

    expect(getPriceReviewSignal({ qty: 1 }, {
      vendor_options: [
        { vendor_id: "v1", price: 1000, last_checked_at: "2026-05-20T00:00:00.000Z" },
      ],
    })).toMatchObject({
      needsReview: false,
      label: "가격 확인됨",
      nextAction: "승인 또는 반려를 결정",
    });
  });

  it("중복 발주 신호에 진행중/승인대기 수량을 함께 반영한다", () => {
    expect(getDuplicateReviewSignal(null, { unit: "개" })).toBeNull();
    expect(getDuplicateReviewSignal({
      hasDuplicate: true,
      orderedCount: 1,
      orderedQty: 2,
      pendingCount: 1,
      pendingQty: 3,
    }, { unit: "개" })).toEqual({
      label: "중복 발주 검토",
      reason: "같은 품목이 이미 진행중 2개 · 승인대기 3개 있습니다",
      nextAction: "진행중 탭에서 배송/입고 상태 먼저 확인",
    });
  });

  it("저재고 품목은 매니저 승인 가능 상태로 최저가 승인 추천을 만든다", () => {
    const decision = getApprovalDecision(
      { qty: 2, vendor_id: "cheap", vendor_price: 9000 },
      {
        name: "봉합사",
        current_qty: 1,
        min_qty: 5,
        unit: "개",
        vendor_options: [
          { vendor_id: "expensive", vendor_name: "고가덴탈", price: 12000, in_stock: true, last_checked_at: "2026-05-20T00:00:00.000Z" },
          { vendor_id: "cheap", vendor_name: "저가덴탈", price: 9000, in_stock: true, last_checked_at: "2026-05-20T00:00:00.000Z" },
        ],
      },
      null,
      120000,
    );

    expect(decision).toMatchObject({
      requiresOwnerApproval: false,
      ownerReviewReasons: [],
      reason: "최소수량보다 4개 부족합니다",
      nextAction: "최저가 후보 확인 후 승인",
      selectedAmount: 18000,
      bestSavings: 6000,
      stockLabel: "최소보다 4개 부족",
      vendorLabel: "저가덴탈 최저 후보",
    });
    expect(decision.decision).toMatchObject({
      label: "승인 추천",
      gateLabel: "매니저 승인 가능",
    });
    expect(decision.checklist.map(row => [row.label, row.value])).toEqual([
      ["부족 여부", "4개 부족"],
      ["중복 발주", "중복 없음"],
      ["최저가/가격", "최저가 후보"],
      ["한도 추정", "한도 내"],
      ["원장 승인", "불필요"],
    ]);
  });

  it("한도 초과, 가격 후보 없음, 중복 발주는 원장 승인 사유로 묶는다", () => {
    const decision = getApprovalDecision(
      { qty: 1, vendor_price: 100000 },
      {
        name: "임플란트 키트",
        current_qty: 0,
        min_qty: 1,
        unit: "세트",
        vendor_options: [],
      },
      {
        hasDuplicate: true,
        orderedCount: 1,
        orderedQty: 1,
        pendingCount: 0,
        pendingQty: 0,
      },
      600000,
    );

    expect(decision.requiresOwnerApproval).toBe(true);
    expect(decision.ownerReviewReasons).toEqual([
      "1회 10만원 이상",
      "가격 후보 없음",
      "중복 발주",
      "월 50만원 초과 가능",
    ]);
    expect(decision.decision).toMatchObject({
      label: "보류 추천",
      gateLabel: "원장 승인 필요",
    });
    expect(decision.reason).toBe("1회 10만원 이상 · 가격 후보 없음 · 중복 발주 · 월 50만원 초과 가능");
    expect(decision.nextAction).toBe("보류로 넘기고 원장 검토 후 승인");
    expect(decision.recommendationDetail).toBe("원장 검토 사유: 1회 10만원 이상 · 가격 후보 없음 · 중복 발주 · 월 50만원 초과 가능");
  });

  it("배송 지연 신호를 기준 시점별로 계산한다", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));

    const { getShippingDelaySignal } = await import("../components/shared/ShippingOrderCard/shippingOrderCard.utils.js");

    expect(getShippingDelaySignal({
      status: "ordered",
      reviewed_at: "2026-05-16T00:00:00.000Z",
      tracking_number: "",
    })).toEqual({
      tone: "warning",
      title: "송장 등록 지연",
      body: "승인 후 4일째 송장이 없습니다 · 거래처/송장 확인 필요",
    });
    expect(getShippingDelaySignal({
      status: "ordered",
      reviewed_at: "2026-05-18T00:00:00.000Z",
      tracking_number: "1234",
      shipping_events: [
        { status: "배달완료", timestamp: "2026-05-18T00:00:00.000Z" },
      ],
    })).toEqual({
      tone: "danger",
      title: "배송완료 후 입고 미확인",
      body: "도착 후 2일 지났습니다 · 입고 수량 확인 필요",
    });
    expect(getShippingDelaySignal({ status: "pending" })).toBeNull();

    vi.useRealTimers();
  });
});
