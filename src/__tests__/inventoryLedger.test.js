import { describe, expect, it } from "vitest";
import {
  buildTransactionIntentKey,
  computeStockFromTransactions,
  findDuplicateTransactionIntent,
  getTransactionDelta,
  hasDuplicateTransactionIntent,
  validateStockAdjustment,
} from "../utils/inventoryLedger";

describe("inventory ledger helpers", () => {
  it("computes 입고/출고/수술사용 stock math in chronological order", () => {
    const txs = [
      { id: "t3", item_id: "gauze", type: "out", qty: 2, surgery_id: "s1", note: "수술 실사용", created_at: "2026-05-20T11:00:00" },
      { id: "t1", item_id: "gauze", type: "in", qty: 5, note: "입고", created_at: "2026-05-20T09:00:00" },
      { id: "t2", item_id: "gauze", type: "out", qty: 4, note: "진료실 출고", created_at: "2026-05-20T10:00:00" },
      { id: "other", item_id: "mask", type: "out", qty: 99, created_at: "2026-05-20T10:30:00" },
    ];

    expect(computeStockFromTransactions(txs, { itemId: "gauze", initialQty: 10 })).toBe(9);
  });

  it("applies 보정 transactions as absolute after_qty corrections", () => {
    const txs = [
      { id: "t1", item_id: "implant", type: "out", qty: 3, created_at: "2026-05-20T09:00:00" },
      { id: "t2", item_id: "implant", type: "adjust", qty: 5, before_qty: 7, after_qty: 12, created_at: "2026-05-20T10:00:00" },
      { id: "t3", item_id: "implant", type: "out", qty: 2, created_at: "2026-05-20T11:00:00" },
    ];

    expect(getTransactionDelta(txs[1])).toBe(5);
    expect(computeStockFromTransactions(txs, { itemId: "implant", initialQty: 10 })).toBe(10);
  });

  it("supports signed delta 보정 records when before/after are absent", () => {
    const txs = [
      { id: "t1", item_id: "cotton", type: "adjust", delta: -4, qty: 4, created_at: "2026-05-20T09:00:00" },
      { id: "t2", item_id: "cotton", type: "in", qty: 2, created_at: "2026-05-20T10:00:00" },
    ];

    expect(computeStockFromTransactions(txs, { itemId: "cotton", initialQty: 20 })).toBe(18);
  });

  it("rejects stock changes that would produce negative quantity", () => {
    expect(validateStockAdjustment({ currentQty: 5, type: "out", qty: 6 })).toMatchObject({
      ok: false,
      code: "insufficient_stock",
      beforeQty: 5,
      afterQty: -1,
    });

    expect(validateStockAdjustment({ currentQty: 2, type: "adjust", afterQty: -1 })).toMatchObject({
      ok: false,
      code: "negative_stock",
      beforeQty: 2,
      afterQty: -1,
    });
  });

  it("returns normalized validation details for accepted movements and corrections", () => {
    expect(validateStockAdjustment({ currentQty: 5, type: "in", qty: "3" })).toEqual({
      ok: true,
      type: "in",
      qty: 3,
      beforeQty: 5,
      afterQty: 8,
      delta: 3,
    });

    expect(validateStockAdjustment({ currentQty: 8, type: "adjust", afterQty: 6 })).toEqual({
      ok: true,
      type: "adjust",
      qty: 2,
      beforeQty: 8,
      afterQty: 6,
      delta: -2,
    });
  });

  it("detects duplicate explicit idempotency keys", () => {
    const existing = [
      { id: "t1", item_id: "gauze", type: "in", qty: 5, idempotency_key: "receipt:o1:5" },
    ];
    const candidate = { item_id: "gauze", type: "in", qty: 5, idempotencyKey: "receipt:o1:5" };

    expect(buildTransactionIntentKey(candidate)).toBe("idempotency:receipt:o1:5");
    expect(findDuplicateTransactionIntent(existing, candidate)).toBe(existing[0]);
    expect(hasDuplicateTransactionIntent(existing, candidate)).toBe(true);
  });

  it("detects duplicate sourced transaction intent without treating different rows as duplicates", () => {
    const existing = [
      { id: "t1", item_id: "implant", type: "out", qty: 1, surgery_id: "s1", note: "수술 실사용", user: "이매니저" },
    ];

    expect(hasDuplicateTransactionIntent(existing, {
      item_id: "implant",
      type: "out",
      qty: 1,
      surgery_id: "s1",
      note: "수술 실사용",
      user: "이매니저",
    })).toBe(true);

    expect(hasDuplicateTransactionIntent(existing, {
      item_id: "healing",
      type: "out",
      qty: 1,
      surgery_id: "s1",
      note: "수술 실사용",
      user: "이매니저",
    })).toBe(false);
  });
});
