import { describe, expect, it } from "vitest";
import { can } from "../constants/permissions";

describe("role permissions", () => {
  it("원장은 비용/직원/수술/관리자 검토 권한을 가진다", () => {
    expect(can("owner", "cost_view")).toBe(true);
    expect(can("owner", "staff")).toBe(true);
    expect(can("owner", "surgery_manage")).toBe(true);
    expect(can("owner", "orders_approve_owner_review")).toBe(true);
  });

  it("매니저는 승인과 재고 운영은 가능하지만 원장 비용/최종검토는 제한된다", () => {
    expect(can("manager", "orders_approve_standard")).toBe(true);
    expect(can("manager", "orders_hold")).toBe(true);
    expect(can("manager", "items")).toBe(true);
    expect(can("manager", "cost_view")).toBe(false);
    expect(can("manager", "orders_approve_owner_review")).toBe(false);
  });

  it("일반 직원은 수술 준비/재고 작업 중심 권한만 가진다", () => {
    ["hygienist", "staff"].forEach(role => {
      expect(can(role, "items")).toBe(true);
      expect(can(role, "surgery_confirm")).toBe(true);
      expect(can(role, "home_stock_work")).toBe(true);
      expect(can(role, "orders_approve")).toBe(false);
      expect(can(role, "staff")).toBe(false);
      expect(can(role, "cost_view")).toBe(false);
    });
  });

  it("정의되지 않은 역할이나 권한은 기본 차단한다", () => {
    expect(can("unknown", "items")).toBe(false);
    expect(can("owner", "unknown_permission")).toBe(false);
  });
});
