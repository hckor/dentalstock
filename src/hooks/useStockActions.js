import { useRef } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseItemsApi } from "../api/supabaseItemsApi";

export function useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal }) {
  const inFlightRef = useRef(false);

  const addTransactionLog = (type, selItem, form, qty) => {
    setTxs(p=>[{id:`t${Date.now()}`, item_id:selItem.id, type, qty, note:form.note, created_at:new Date().toISOString(), user:currentUser.name},...p]);
  };

  const recordAuditLog = (type, selItem, form, qty, after) => {
    auditLogsApi.record({
      action: type === "in" ? "stock.in" : "stock.out",
      entityType: "item",
      entityId: selItem.id,
      actor: currentUser,
      metadata: {
        item_name: selItem.name,
        qty,
        before_qty: selItem.current_qty,
        after_qty: after,
        note: form.note || "",
      },
    });
  };

  const maybeNotifyLowStock = (item) => {
    if (item.current_qty < item.min_qty)
      setNotifs(p=>[{id:`n${Date.now()}`, type:"low_stock", item_id:item.id, message:`${item.name} 재고가 부족합니다`, sub:`현재 ${item.current_qty}${item.unit} · 최소 ${item.min_qty}${item.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
  };

  const commitLocal = (type, selItem, form, qty) => {
    const after = type==="in" ? selItem.current_qty+qty : selItem.current_qty-qty;
    const upd   = items.map(i=>i.id===selItem.id?{...i,current_qty:after}:i);
    setItems(upd);
    addTransactionLog(type, selItem, form, qty);
    recordAuditLog(type, selItem, form, qty, after);
    const u = upd.find(i=>i.id===selItem.id);
    maybeNotifyLowStock(u);
    showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
    setModal(null);
  };

  const commitSupabase = async (type, selItem, form, qty) => {
    if (inFlightRef.current) return;
    if (!selItem.supabase_id) {
      showToast("Supabase 품목 연결 정보가 없습니다.");
      return;
    }

    inFlightRef.current = true;
    try {
      const updatedItem = await supabaseItemsApi.applyStockTransaction({
        itemId: selItem.supabase_id,
        type,
        quantity: qty,
        reason: form.note || "",
      });
      const mergedItem = { ...selItem, ...updatedItem };
      setItems(prev=>prev.map(i=>i.id===selItem.id?mergedItem:i));
      addTransactionLog(type, selItem, form, qty);
      recordAuditLog(type, selItem, form, qty, mergedItem.current_qty);
      maybeNotifyLowStock(mergedItem);
      showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
      setModal(null);
    } catch (error) {
      const message = error?.message || "";
      if (message.includes("insufficient_stock")) {
        showToast(`현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`);
      } else {
        showToast("입출고 저장에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  const commit = (type, selItem, form) => {
    if (!selItem) return;
    const requestedQty = Math.max(1, parseInt(form.qty)||1);
    if (type==="out" && requestedQty > selItem.current_qty) {
      showToast(`현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`);
      return;
    }
    const qty = requestedQty;
    if (supabaseItemsApi.isEnabled()) {
      void commitSupabase(type, selItem, form, qty);
      return;
    }
    commitLocal(type, selItem, form, qty);
  };

  return { commit };
}
