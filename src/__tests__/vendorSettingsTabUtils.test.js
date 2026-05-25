import { describe, expect, it } from "vitest";
import {
  buildMonitorSummary,
  buildPolicySummary,
  formatCurrency,
  formatDateTime,
  moneyInput,
  resolveMonthlyOrderLimit,
  toPositiveNumber,
} from "../components/screens/AdminScreen/VendorSettingsTab.utils";

describe("VendorSettingsTab pure utilities", () => {
  it("금액 입력과 설정 한도 fallback을 화면 저장 형식에 맞춘다", () => {
    expect(toPositiveNumber("1200")).toBe(1200);
    expect(toPositiveNumber("-1")).toBe(0);
    expect(toPositiveNumber(Number.POSITIVE_INFINITY)).toBe(0);
    expect(moneyInput("월 300,000원")).toBe("300000");
    expect(formatCurrency(0)).toBe("미설정");
    expect(formatCurrency("12500")).toBe("12,500원");
    expect(resolveMonthlyOrderLimit({ monthlyOrderLimit: "450000" })).toBe("450000");
    expect(resolveMonthlyOrderLimit({ monthlyBudgetAmount: 250000 })).toBe("250000");
    expect(resolveMonthlyOrderLimit({ monthlyLimit: 150000 })).toBe("150000");
    expect(resolveMonthlyOrderLimit({})).toBe("300000");
  });

  it("날짜 표시가 유효하지 않은 값에서 확인 전으로 떨어진다", () => {
    expect(formatDateTime("")).toBe("확인 전");
    expect(formatDateTime("not-a-date")).toBe("확인 전");
    expect(formatDateTime("2026-05-20T09:30:00+09:00")).toMatch(/5\. 20\./);
  });

  it("모니터링 품목과 저재고 추천 거래처를 계산한다", () => {
    const vendors = [
      { id: "v1", name: "A덴탈" },
      { id: "v2", name: "B덴탈" },
    ];
    const summary = buildMonitorSummary({
      vendors,
      preferredVendor: "lowest",
      maxOrderAmount: 100000,
      monthlyOrderLimit: 300000,
      items: [
        {
          id: "needle",
          name: "니들",
          current_qty: 1,
          min_qty: 4,
          vendor_options: [
            { vendor_id: "v1", price: 9000, shipping_fee: 9000, min_order_qty: 3, in_stock: true },
            { vendor_id: "v2", price: 10000, shipping_fee: 0, min_order_qty: 1, in_stock: true },
          ],
        },
        {
          id: "glove",
          name: "글러브",
          current_qty: 10,
          min_qty: 2,
          vendor_options: [
            { vendor_id: "v1", price: 5000 },
          ],
        },
        {
          id: "plain",
          name: "후보 없음",
          current_qty: 0,
          min_qty: 5,
          vendor_options: [],
        },
      ],
    });

    expect(summary.monitoredCount).toBe(2);
    expect(summary.candidateCount).toBe(3);
    expect(summary.lowStockRecommendations).toHaveLength(1);
    expect(summary.lowStockRecommendations[0].qty).toBe(3);
    expect(summary.lowStockRecommendations[0].vendor).toMatchObject({
      vendor_id: "v2",
      vendor_name: "B덴탈",
      vendor_price: 10000,
      vendor_selection: "lowest",
    });
  });

  it("거래처 정책 상태, 오래된 가격, 최저가 승수를 거래처별로 집계한다", () => {
    const latest = "2026-05-19T00:00:00.000Z";
    const stale = "2026-05-01T00:00:00.000Z";
    const policy = buildPolicySummary({
      vendors: [
        { id: "v1", name: "A덴탈" },
        { id: "v2", name: "B덴탈", automaticOrdering: false },
      ],
      credentialStatuses: {
        v1: { connected: true },
        v2: { connected: false },
      },
      preferredVendor: "v2",
      priceReferenceTime: new Date("2026-05-20T00:00:00.000Z").getTime(),
      items: [
        {
          id: "needle",
          min_qty: 5,
          current_qty: 2,
          vendor_options: [
            { vendor_id: "v1", vendor_name: "A덴탈", price: 100, shipping_fee: 30, min_order_qty: 3, url: "https://a.example/needle", in_stock: true, last_checked_at: latest },
            { vendor_id: "v2", vendor_name: "B덴탈", price: 80, shipping_fee: 0, min_order_qty: 1, url: "", in_stock: true, last_checked_at: stale },
          ],
        },
        {
          id: "glove",
          min_qty: 1,
          current_qty: 1,
          vendor_options: [
            { vendor_id: "v1", vendor_name: "A덴탈", price: 0, shipping_fee: 0, min_order_qty: 5, url: "https://a.example/glove" },
          ],
        },
      ],
    });

    expect(policy).toMatchObject({
      connectedCount: 1,
      automaticCount: 1,
      preferredVendorName: "B덴탈",
      latestCheckedAt: latest,
      uncheckedCount: 1,
      staleCount: 1,
    });

    const byVendorId = new Map(policy.vendorStats.map(stat => [stat.id, stat]));
    expect(byVendorId.get("v1")).toMatchObject({
      optionCount: 2,
      urlCount: 2,
      inStockCount: 2,
      pricedCount: 1,
      uncheckedCount: 1,
      staleCount: 0,
      lowestWins: 0,
      shippingTotal: 30,
      shippingCount: 1,
      maxMinOrderQty: 5,
      latestCheckedAt: latest,
    });
    expect(byVendorId.get("v2")).toMatchObject({
      optionCount: 1,
      urlCount: 0,
      inStockCount: 1,
      pricedCount: 1,
      uncheckedCount: 0,
      staleCount: 1,
      lowestWins: 1,
      shippingTotal: 0,
      shippingCount: 0,
      maxMinOrderQty: 1,
      latestCheckedAt: stale,
    });
  });
});
