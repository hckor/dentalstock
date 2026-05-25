import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStockActions } from "../hooks/useStockActions";

describe("inventory stock action reliability", () => {
  let mockSetItems;
  let mockSetTxs;
  let mockSetNotifs;
  let mockShowToast;
  let mockSetModal;
  let items;
  let currentUser;

  beforeEach(() => {
    mockSetItems = vi.fn();
    mockSetTxs = vi.fn();
    mockSetNotifs = vi.fn();
    mockShowToast = vi.fn();
    mockSetModal = vi.fn();

    items = [
      { id: "1", name: "거즈", current_qty: 10, min_qty: 5, unit: "박스" },
    ];
    currentUser = { name: "박위생사", role: "hygienist" };
  });

  function renderStockActions(extraProps = {}) {
    return renderHook(() =>
      useStockActions({
        items,
        txs: [],
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal,
        ...extraProps,
      })
    );
  }

  it("rejects duplicate idempotency keys that are already in txs", () => {
    const existingTxs = [
      { id: "t1", item_id: "1", type: "out", qty: 2, idempotency_key: "manual:out:1:2" },
    ];
    const { result } = renderStockActions({ txs: existingTxs });

    act(() => {
      result.current.commit("out", items[0], { qty: 2, note: "진료실", idempotencyKey: "manual:out:1:2" });
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith("이미 처리된 재고 변경입니다.");
  });

  it("treats a repeated in-session idempotency key as already processed", () => {
    const { result } = renderStockActions();

    act(() => {
      result.current.commit("out", items[0], { qty: 2, note: "진료실", idempotencyKey: "manual:out:1:2" });
    });
    act(() => {
      result.current.commit("out", items[0], { qty: 2, note: "진료실", idempotencyKey: "manual:out:1:2" });
    });

    expect(mockSetItems).toHaveBeenCalledOnce();
    expect(mockSetTxs).toHaveBeenCalledOnce();
    expect(mockShowToast).toHaveBeenLastCalledWith("이미 처리된 재고 변경입니다.");
  });
});
