import { describe, expect, it } from "vitest";
import {
  buildBulkOrderRequestAuditMetadata,
  buildBulkOrderRequestNotification,
  buildOrderRequest,
  buildOrderRequestAuditMetadata,
  buildOrderRequestNotification,
  buildOrderRequestToast,
  getAvailableOrderRequests,
  normalizeOrderRequests,
} from "../utils/orderSubmission";

const item = { id: "i1", name: "거즈", unit: "박스" };

describe("order submission utilities", () => {
  it("pending 발주 요청 객체를 생성한다", () => {
    expect(buildOrderRequest({
      item,
      qty: 5,
      note: "급함",
      requestedBy: "이매니저",
      requestedAt: "2026-05-25T10:00:00.000Z",
      id: "o1",
      vendorSnapshot: { vendor_id: "v1", vendor_name: "덴올" },
    })).toMatchObject({
      id: "o1",
      item_id: "i1",
      requested_by: "이매니저",
      requested_at: "2026-05-25T10:00:00.000Z",
      qty: 5,
      note: "급함",
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_note: "",
      vendor_id: "v1",
      vendor_name: "덴올",
    });
  });

  it("일괄 발주 입력을 숫자 수량이 있는 행만 정규화한다", () => {
    expect(normalizeOrderRequests([
      { item, qty: "3" },
      { item: { id: "i2" }, qty: 0 },
      { item: null, qty: 5 },
      { item: { id: "i3" }, qty: "abc" },
    ])).toEqual([{ item, qty: 3 }]);
  });

  it("이미 진행 중인 발주가 있는 품목은 제외한다", () => {
    const requests = [
      { item, qty: 5 },
      { item: { id: "i2", name: "면봉" }, qty: 2 },
    ];
    const result = getAvailableOrderRequests(requests, [
      { id: "o1", item_id: "i1", status: "pending" },
      { id: "o2", item_id: "i3", status: "ordered" },
    ]);

    expect(result.availableRequests).toEqual([requests[1]]);
    expect(result.skippedCount).toBe(1);
  });

  it("알림, 감사로그, 토스트 문구를 만든다", () => {
    expect(buildOrderRequestNotification({
      item,
      qty: 5,
      userName: "이매니저",
      createdAt: "now",
    })).toMatchObject({
      type: "order_req",
      item_id: "i1",
      message: "거즈 발주 요청이 도착했습니다",
      sub: "이매니저 · 5박스",
      created_at: "now",
    });
    expect(buildBulkOrderRequestNotification({
      count: 2,
      skippedCount: 1,
      userName: "이매니저",
      createdAt: "now",
    })).toMatchObject({
      item_id: null,
      message: "부족 품목 2건 발주 요청이 도착했습니다",
      sub: "이매니저 · 1건 제외",
    });
    expect(buildOrderRequestAuditMetadata({
      item,
      qty: 5,
      note: "급함",
      vendorSnapshot: { vendor_id: "v1", vendor_name: "덴올" },
    })).toEqual({
      item_id: "i1",
      item_name: "거즈",
      qty: 5,
      note: "급함",
      vendor_id: "v1",
      vendor_name: "덴올",
    });
    expect(buildBulkOrderRequestAuditMetadata({
      requests: [{ item, qty: 5 }],
      skippedCount: 1,
      note: "",
    })).toEqual({
      count: 1,
      skipped_count: 1,
      items: "거즈:5박스",
      note: "",
    });
    expect(buildOrderRequestToast({ item })).toBe("거즈 발주 요청 완료");
    expect(buildOrderRequestToast({ count: 1, skippedCount: 1 })).toBe("1건 발주 요청 완료 · 1건 제외");
  });
});
