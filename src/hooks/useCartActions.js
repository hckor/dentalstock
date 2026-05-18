import { getActiveOrder } from "../utils/helpers";

export function useCartActions({ cart, setCart, orders, setOrders, setNotifs, items, currentUser, showToast, setTab }) {
  const updateCartQty = (itemId, qty) => {
    setCart(p => p.map(c => c.item_id === itemId ? { ...c, qty } : c));
  };

  const removeFromCart = (itemId) => {
    setCart(p => p.filter(c => c.item_id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm("장바구니를 모두 비우시겠습니까?")) return;
    setCart([]);
    showToast("장바구니를 비웠어요");
  };

  // ── 장바구니 일괄 발주 요청 ─────────────────────────
  const submitCart = () => {
    if (cart.length === 0) return;
    // 진행 중인 발주가 생긴 품목은 자동 제외
    const valid = cart.filter(c => !getActiveOrder(orders, c.item_id));
    const skipped = cart.length - valid.length;
    if (valid.length === 0) {
      showToast("이미 진행 중인 발주만 있어요");
      return;
    }
    const now = new Date().toISOString();
    const newOrders = valid.map((c, i) => ({
      id: `o${Date.now()}-${i}`,
      item_id: c.item_id,
      requested_by: currentUser.name,
      requested_at: now,
      qty: c.qty,
      note: c.note,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_note: "",
    }));
    const newNotifs = valid.map((c, i) => {
      const item = items.find(it => it.id === c.item_id);
      return {
        id: `n${Date.now()}-${i}`,
        type: "order_req",
        item_id: c.item_id,
        message: `${item?.name} 발주 요청이 도착했습니다`,
        sub: `${currentUser.name} · ${c.qty}${item?.unit || ""}`,
        is_read: false,
        created_at: now,
      };
    });
    setOrders(p => [...newOrders, ...p]);
    setNotifs(p => [...newNotifs, ...p]);
    setCart([]);
    showToast(`${valid.length}건 발주 요청 완료${skipped > 0 ? ` (${skipped}건 자동 제외)` : ""}`);
    setTab("home");
  };

  return { updateCartQty, removeFromCart, clearCart, submitCart };
}
