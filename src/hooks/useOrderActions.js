import { getActiveOrder } from "../utils/helpers";

export function useOrderActions({ orders, setOrders, items, setItems, cart, setCart, setTxs, setNotifs, currentUser, showToast, setModal }) {
  // ── 발주 요청 → 장바구니 담기 ───────────────────────
  const submitOrder = (item, qty, note) => {
    if (getActiveOrder(orders, item.id)) {
      showToast("이미 진행 중인 발주가 있습니다.");
      setModal(null);
      return;
    }
    if (cart.some(c => c.item_id === item.id)) {
      showToast("이미 장바구니에 담긴 품목입니다.");
      setModal(null);
      return;
    }
    setCart(p => [...p, { item_id: item.id, qty, note }]);
    showToast(`${item.name} 장바구니에 담았어요`);
    setModal(null);
  };

  // ── 발주 승인 (ordered 상태로, 재고 반영 없음) ────────
  const approveOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"ordered", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"ordered", item_id:item.id, message:`${item.name} 발주가 완료되었습니다`, sub:`${currentUser.name} 승인 · ${order.qty}${item.unit} 배송 대기`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주가 승인되었습니다.");
  };

  // ── 발주 거절 ────────────────────────────────────────
  const rejectOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"rejected", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"order_rejected", item_id:item.id, message:`${item.name} 발주가 거절되었습니다`, sub:`${currentUser.name} · ${reviewNote||"사유 없음"}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주 요청이 거절되었습니다");
  };

  // ── 실 입고 확인 (ordered → received, 재고 반영) ──────
  const confirmReceipt = (orderId, actualQty, note) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "ordered") {
      showToast("입고 확인할 발주를 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("입고 품목을 찾을 수 없습니다.");
      return;
    }
    const after = item.current_qty + actualQty;
    setItems(p=>p.map(i=>i.id===item.id?{...i, current_qty:after}:i));
    setTxs(p=>[{id:`t${Date.now()}`, item_id:item.id, type:"in", qty:actualQty, note:`발주 입고 확인 (요청자: ${order.requested_by})${note?` · ${note}`:""}`, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"received"}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"received", item_id:item.id, message:`${item.name} 입고 확인 완료`, sub:`${currentUser.name} 확인 · ${actualQty}${item.unit} 입고`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${actualQty}${item.unit} 입고 확인 완료`);
    setModal(null);
  };

  // ── 배송 추적 시작 (pending → ordered + 송장 정보 저장) ──
  const startTracking = (orderId, carrier, trackingNumber) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== "pending") {
      showToast("추적 시작할 주문을 찾을 수 없습니다.");
      return;
    }
    const item = items.find(i => i.id === order.item_id);
    setOrders(p => p.map(o => o.id === orderId
      ? { ...o, status: "ordered", carrier, tracking_number: trackingNumber, reviewed_by: currentUser.name, reviewed_at: new Date().toISOString() }
      : o
    ));
    if (item) {
      setNotifs(p => [{ id: `n${Date.now()}`, type: "ordered", item_id: item.id, message: `${item.name} 배송 추적이 시작됐습니다`, sub: `${carrier} · ${trackingNumber}`, is_read: false, created_at: new Date().toISOString() }, ...p]);
    }
    showToast("배송 추적이 시작됐습니다");
  };

  return { submitOrder, approveOrder, rejectOrder, confirmReceipt, startTracking };
}
