export function useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal }) {
  const commit = (type, selItem, form) => {
    if (!selItem) return;
    const requestedQty = Math.max(1, parseInt(form.qty)||1);
    const qty   = type==="out" ? Math.min(requestedQty, selItem.current_qty) : requestedQty;
    if (type==="out" && qty < requestedQty) {
      showToast(`현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`);
    }
    if (type==="out" && qty === 0) return;
    const after = type==="in" ? selItem.current_qty+qty : selItem.current_qty-qty;
    const upd   = items.map(i=>i.id===selItem.id?{...i,current_qty:after}:i);
    setItems(upd);
    setTxs(p=>[{id:`t${Date.now()}`, item_id:selItem.id, type, qty, note:form.note, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    const u = upd.find(i=>i.id===selItem.id);
    if (u.current_qty < u.min_qty)
      setNotifs(p=>[{id:`n${Date.now()}`, type:"low_stock", item_id:selItem.id, message:`${selItem.name} 재고가 부족합니다`, sub:`현재 ${u.current_qty}${selItem.unit} · 최소 ${selItem.min_qty}${selItem.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
    setModal(null);
  };

  return { commit };
}
