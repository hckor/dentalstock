import { describe, expect, it } from "vitest";
import { ROLE_CAPABILITIES, ROLE_CAPABILITY_MATRIX, can } from "../constants/permissions";

const C = ROLE_CAPABILITIES;

describe("role permissions", () => {
  it("중앙 role capability matrix는 핵심 보기/쓰기 권한을 역할별로 표현한다", () => {
    expect(ROLE_CAPABILITY_MATRIX.owner).toMatchObject({
      [C.VIEW_COST]: true,
      [C.VIEW_APPROVAL]: true,
      [C.VIEW_STAFF]: true,
      [C.VIEW_ALL_STATUS]: true,
      [C.APPROVE_ORDER]: true,
      [C.MANAGE_INVENTORY]: true,
      [C.MANAGE_ORDER]: true,
      [C.MANAGE_STAFF]: true,
      [C.MANAGE_SURGERY_PREP]: true,
    });

    expect(ROLE_CAPABILITY_MATRIX.manager).toMatchObject({
      [C.VIEW_COST]: false,
      [C.VIEW_APPROVAL]: true,
      [C.VIEW_STAFF]: true,
      [C.VIEW_ALL_STATUS]: true,
      [C.APPROVE_ORDER]: true,
      [C.MANAGE_INVENTORY]: true,
      [C.MANAGE_ORDER]: true,
      [C.MANAGE_STAFF]: true,
      [C.MANAGE_SURGERY_PREP]: true,
    });

    ["hygienist", "staff"].forEach(role => {
      expect(ROLE_CAPABILITY_MATRIX[role]).toMatchObject({
        [C.VIEW_COST]: false,
        [C.VIEW_APPROVAL]: false,
        [C.VIEW_STAFF]: false,
        [C.VIEW_ALL_STATUS]: false,
        [C.APPROVE_ORDER]: false,
        [C.MANAGE_INVENTORY]: false,
        [C.MANAGE_ORDER]: false,
        [C.MANAGE_STAFF]: false,
        [C.MANAGE_SURGERY_PREP]: false,
        [C.CONFIRM_SURGERY_PREP]: true,
      });
    });
  });

  it("원장은 비용/직원/수술/관리자 검토 권한을 가진다", () => {
    expect(can("owner", "cost_view")).toBe(true);
    expect(can("owner", "staff")).toBe(true);
    expect(can("owner", "surgery_manage")).toBe(true);
    expect(can("owner", "orders_approve_owner_review")).toBe(true);
    expect(can("owner", C.MANAGE_STAFF)).toBe(true);
  });

  it("매니저는 승인과 재고/직원 운영은 가능하지만 원장 비용/최종검토는 제한된다", () => {
    expect(can("manager", "orders_approve_standard")).toBe(true);
    expect(can("manager", "orders_hold")).toBe(true);
    expect(can("manager", "items")).toBe(true);
    expect(can("manager", "staff")).toBe(true);
    expect(can("manager", C.MANAGE_INVENTORY)).toBe(true);
    expect(can("manager", C.MANAGE_ORDER)).toBe(true);
    expect(can("manager", C.VIEW_STAFF)).toBe(true);
    expect(can("manager", C.MANAGE_STAFF)).toBe(true);
    expect(can("manager", "cost_view")).toBe(false);
    expect(can("manager", "orders_approve_owner_review")).toBe(false);
  });

  it("일반 직원은 수술 준비/재고 작업 중심 권한만 가진다", () => {
    ["hygienist", "staff"].forEach(role => {
      expect(can(role, "items")).toBe(true);
      expect(can(role, "surgery_confirm")).toBe(true);
      expect(can(role, "home_stock_work")).toBe(true);
      expect(can(role, C.CONFIRM_SURGERY_PREP)).toBe(true);
      expect(can(role, "orders_approve")).toBe(false);
      expect(can(role, "staff")).toBe(false);
      expect(can(role, "cost_view")).toBe(false);
      expect(can(role, C.MANAGE_INVENTORY)).toBe(false);
      expect(can(role, C.MANAGE_ORDER)).toBe(false);
    });
  });

  it("정의되지 않은 역할이나 권한은 기본 차단한다", () => {
    expect(can("unknown", "items")).toBe(false);
    expect(can("owner", "unknown_permission")).toBe(false);
  });
});
