import { describe, expect, it } from "vitest";
import { buildHomeDashboard } from "../utils/homeDashboard";

describe("homeDashboard owner review queue", () => {
  it("원장 승인 필요 pending과 매니저가 보류로 넘긴 주문을 원장 검토 큐에 모은다", () => {
    const dashboard = buildHomeDashboard({
      items: [
        { id: "implant", name: "임플란트 키트", price: 120000, current_qty: 0, min_qty: 1 },
        { id: "gauze", name: "거즈", price: 5000, current_qty: 1, min_qty: 3 },
      ],
      orders: [
        { id: "o1", item_id: "implant", qty: 1, status: "pending", requested_at: "2026-05-20T09:00:00.000Z" },
        { id: "o2", item_id: "gauze", qty: 2, status: "hold", requested_at: "2026-05-20T10:00:00.000Z" },
        { id: "o3", item_id: "gauze", qty: 1, status: "ordered", requested_at: "2026-05-20T11:00:00.000Z" },
      ],
    });

    expect(dashboard.orders.ownerReview.map(order => order.id)).toEqual(["o1", "o2"]);
    expect(dashboard.orders.ownerReviewAmount).toBe(130000);
  });
});
