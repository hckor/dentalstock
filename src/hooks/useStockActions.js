import { useCallback, useMemo, useRef } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseItemsApi } from "../api/supabaseItemsApi";
import { handleAppError } from "../utils/errorHandling";
import {
  buildTransactionIntentKey,
  hasDuplicateTransactionIntent,
  validateStockAdjustment,
} from "../utils/inventoryLedger";

function getFormIdempotencyKey(form = {}) {
  return form.idempotency_key ?? form.idempotencyKey ?? form.intent_key ?? form.intentKey ?? null;
}

function buildTransactionLog(type, selItem, form, qty, currentUser) {
  const idempotencyKey = getFormIdempotencyKey(form);
  return {
    id:`t${Date.now()}`,
    item_id:selItem.id,
    type,
    qty,
    note:form.note,
    created_at:new Date().toISOString(),
    user:currentUser.name,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  };
}

export function useStockActions({ items, setItems, txs = [], setTxs, setNotifs, currentUser, showToast, setModal }) {
  const inFlightRef = useRef(false);
  const processedIntentKeysRef = useRef(new Set());

  const addTransactionLog = useCallback((type, selItem, form, qty) => {
    const transaction = buildTransactionLog(type, selItem, form, qty, currentUser);
    setTxs(p=>hasDuplicateTransactionIntent(p, transaction) ? p : [transaction,...p]);
  }, [currentUser, setTxs]);

  const recordAuditLog = useCallback((type, selItem, form, qty, after) => {
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
  }, [currentUser]);

  const maybeNotifyLowStock = useCallback((item) => {
    if (item.current_qty < item.min_qty)
      setNotifs(p=>[{id:`n${Date.now()}`, type:"low_stock", item_id:item.id, message:`${item.name} 재고가 부족합니다`, sub:`현재 ${item.current_qty}${item.unit} · 최소 ${item.min_qty}${item.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
  }, [setNotifs]);

  const commitLocal = useCallback((type, selItem, form, validation) => {
    const qty = validation.qty;
    const after = validation.afterQty;
    const upd   = items.map(i=>i.id===selItem.id?{...i,current_qty:after}:i);
    setItems(upd);
    addTransactionLog(type, selItem, form, qty);
    recordAuditLog(type, selItem, form, qty, after);
    const u = upd.find(i=>i.id===selItem.id);
    if (u) maybeNotifyLowStock(u);
    showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
    setModal(null);
  }, [addTransactionLog, items, maybeNotifyLowStock, recordAuditLog, setItems, setModal, showToast]);

  const commitSupabase = useCallback(async (type, selItem, form, validation, intentKey) => {
    if (inFlightRef.current) return;
    if (!selItem.supabase_id) {
      showToast("Supabase 품목 연결 정보가 없습니다.");
      if (intentKey) processedIntentKeysRef.current.delete(intentKey);
      return;
    }

    inFlightRef.current = true;
    try {
      const updatedItem = await supabaseItemsApi.applyStockTransaction({
        itemId: selItem.supabase_id,
        type,
        quantity: validation.qty,
        reason: form.note || "",
      });
      const mergedItem = { ...selItem, ...updatedItem };
      setItems(prev=>prev.map(i=>i.id===selItem.id?mergedItem:i));
      addTransactionLog(type, selItem, form, validation.qty);
      recordAuditLog(type, selItem, form, validation.qty, mergedItem.current_qty);
      maybeNotifyLowStock(mergedItem);
      showToast(`${type==="in"?"입고":"출고"} ${validation.qty}${selItem.unit} 완료`);
      setModal(null);
    } catch (error) {
      if (intentKey) processedIntentKeysRef.current.delete(intentKey);
      const message = error?.message || "";
      if (message.includes("insufficient_stock")) {
        handleAppError(error, {
          context: "stock.transaction.insufficient",
          userMessage: `현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`,
          showToast,
        });
      } else {
        handleAppError(error, {
          context: "stock.transaction.save",
          userMessage: "입출고 저장에 실패했습니다. 다시 시도해주세요.",
          showToast,
        });
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [addTransactionLog, maybeNotifyLowStock, recordAuditLog, setItems, setModal, showToast]);

  const commit = useCallback((type, selItem, form) => {
    if (!selItem) return;
    if (supabaseItemsApi.isEnabled() && inFlightRef.current) return;

    const currentItem = items.find(item => item.id === selItem.id) || selItem;
    const requestedQty = Math.max(1, parseInt(form.qty)||1);
    const validation = validateStockAdjustment({
      currentQty: currentItem.current_qty,
      type,
      qty: requestedQty,
    });

    if (!validation.ok) {
      if (validation.code === "insufficient_stock") {
        showToast(`현재 재고는 ${currentItem.current_qty}${currentItem.unit}입니다.`);
      } else {
        showToast("수량을 확인해주세요.");
      }
      return;
    }

    const idempotencyKey = getFormIdempotencyKey(form);
    const transactionIntent = buildTransactionLog(type, currentItem, form, validation.qty, currentUser);
    const intentKey = buildTransactionIntentKey(transactionIntent);
    if (idempotencyKey && (processedIntentKeysRef.current.has(intentKey) || hasDuplicateTransactionIntent(txs, transactionIntent))) {
      showToast("이미 처리된 재고 변경입니다.");
      return;
    }
    if (idempotencyKey && intentKey) processedIntentKeysRef.current.add(intentKey);

    if (supabaseItemsApi.isEnabled()) {
      void commitSupabase(type, currentItem, form, validation, intentKey);
      return;
    }
    commitLocal(type, currentItem, form, validation);
  }, [commitLocal, commitSupabase, currentUser, items, showToast, txs]);

  return useMemo(() => ({ commit }), [commit]);
}
