import { describe, expect, it } from "vitest";
import {
  buildReviewAuditMetadata,
  buildReviewedOrder,
  buildReviewNotification,
  getReviewAuditAction,
  getReviewToast,
  resolveReviewStatus,
} from "../utils/orderRejection";

describe("order rejection utilities", () => {
  const order = { id: "o1", item_id: "i1", qty: 5, status: "pending" };
  const item = { id: "i1", name: "거즈" };

  it("보류/거절 상태를 정규화하고 리뷰된 주문을 만든다", () => {
    expect(resolveReviewStatus("hold")).toBe("hold");
    expect(resolveReviewStatus("anything")).toBe("rejected");
    expect(buildReviewedOrder({
      order,
      resolvedStatus: "hold",
      currentUserName: "이매니저",
      reviewedAt: "now",
      reviewNote: "확인 필요",
    })).toMatchObject({
      id: "o1",
      status: "hold",
      reviewed_by: "이매니저",
      reviewed_at: "now",
      review_note: "확인 필요",
    });
  });

  it("감사로그/알림/토스트 문구를 만든다", () => {
    expect(buildReviewAuditMetadata({ item, order, reviewNote: "재고 있음" })).toEqual({
      item_id: "i1",
      item_name: "거즈",
      qty: 5,
      review_note: "재고 있음",
    });
    expect(buildReviewNotification({
      item,
      currentUserName: "이매니저",
      reviewNote: "",
      isHold: false,
      createdAt: "now",
    })).toMatchObject({
      type: "order_rejected",
      item_id: "i1",
      message: "거즈 발주가 거절되었습니다",
      sub: "이매니저 · 사유 없음",
      created_at: "now",
    });
    expect(getReviewAuditAction(true)).toBe("order.held");
    expect(getReviewAuditAction(false)).toBe("order.rejected");
    expect(getReviewToast(true)).toBe("발주 요청이 보류되었습니다");
    expect(getReviewToast(false)).toBe("발주 요청이 거절되었습니다");
  });
});
