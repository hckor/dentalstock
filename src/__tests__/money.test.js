import { describe, expect, it } from "vitest";
import {
  compactMoney,
  formatMoney,
  highestVendorPrice,
  itemUnitPrice,
  orderAmount,
  orderUnitPrice,
  toNumber,
} from "../utils/money";

describe("money utilities", () => {
  it("숫자 변환 실패 시 0 또는 지정 fallback을 반환한다", () => {
    expect(toNumber("1200")).toBe(1200);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber(undefined, 7)).toBe(7);
    expect(toNumber(Number.POSITIVE_INFINITY, 9)).toBe(9);
  });

  it("원 단위와 축약 금액을 기존 화면 기준으로 포맷한다", () => {
    expect(formatMoney(12345.6)).toBe("12,346원");
    expect(compactMoney(9500)).toBe("9,500원");
    expect(compactMoney(10000)).toBe("1만원");
    expect(compactMoney(15000)).toBe("2만원");
    expect(compactMoney(-15000)).toBe("-1만원");
  });

  it("품목 자체 가격과 거래처 후보 중 가장 낮은 양수 단가를 사용한다", () => {
    const item = {
      price: 12000,
      vendor_options: [
        { price: 10000 },
        { price: 0 },
        { price: "8000" },
      ],
    };

    expect(itemUnitPrice(item)).toBe(8000);
  });

  it("발주 단가는 저장된 거래처 단가를 우선하고 없으면 품목 최저 단가를 사용한다", () => {
    const item = { price: 12000, vendor_options: [{ price: 9000 }] };

    expect(orderUnitPrice({ vendor_price: 7000 }, item)).toBe(7000);
    expect(orderUnitPrice({ vendor_price: 0 }, item)).toBe(9000);
    expect(orderAmount({ vendor_price: 7000, qty: 3 }, item)).toBe(21000);
  });

  it("거래처 후보 중 가장 높은 양수 단가를 반환한다", () => {
    expect(highestVendorPrice({ vendor_options: [{ price: 1000 }, { price: "3000" }, { price: -1 }] })).toBe(3000);
    expect(highestVendorPrice({ vendor_options: [] })).toBe(0);
  });
});
