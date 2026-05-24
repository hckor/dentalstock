import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseSurgeriesApi } from "../api/supabaseSurgeriesApi";
import { handleAppError } from "../utils/errorHandling";
import {
  buildSurgeryUsageAuditMetadata,
  buildSurgeryUsageTxs,
  mergeUpdatedItem,
} from "./surgeryActionShared";

export function useSurgeryUsageActions({
  canConfirmSurgery,
  surgeries,
  items = [],
  setItems,
  setTxs,
  setNotifs,
  setSurgeries,
  currentUser,
  showToast,
}) {
  const confirmSurgeryUsage = useCallback((surgeryId, usageItems, note = "") => {
    if (!canConfirmSurgery) {
      showToast("수술 사용량 확인 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;
    if (surgery.usage_confirmed) {
      showToast("이미 사용량 확인이 완료되었습니다.");
      return;
    }

    const itemMap = new Map(items.map(item => [item.id, item]));
    const usageRows = (Array.isArray(usageItems) ? usageItems : [])
      .map(row => ({
        item_id: row.item_id,
        qty: Math.max(0, Number(row.qty) || 0),
      }))
      .filter(row => row.item_id);

    const invalidRow = usageRows.find(row => {
      const item = itemMap.get(row.item_id);
      return !item || row.qty > item.current_qty;
    });

    if (invalidRow) {
      const item = itemMap.get(invalidRow.item_id);
      showToast(item ? `${item.name} 현재 재고는 ${item.current_qty}${item.unit}입니다.` : "사용 품목을 찾을 수 없습니다.");
      return;
    }

    const usedRows = usageRows.filter(row => row.qty > 0);
    const usageConfirmedAt = new Date().toISOString();
    const qtyByItemId = new Map(usedRows.map(row => [row.item_id, row.qty]));
    const auditMetadata = buildSurgeryUsageAuditMetadata({ surgery, usedRows, itemMap, note });
    const usageNotification = {
      id:`n${Date.now()}`,
      type:"surgery_usage",
      surgery_id:surgeryId,
      item_id:null,
      message:"수술 실사용량 확인이 완료되었습니다",
      sub:`${surgery.title} · ${usedRows.length}개 품목 출고`,
      is_read:false,
      created_at:usageConfirmedAt,
    };
    const successToast = usedRows.length ? `실사용 ${usedRows.length}개 품목 출고 완료` : "사용 품목 없이 수술을 완료했습니다";

    if (supabaseSurgeriesApi.isEnabled()) {
      void supabaseSurgeriesApi.confirmUsage(surgery, { usageItems: usageRows, note })
        .then(({ surgery: savedSurgery, items: updatedItems }) => {
          if (updatedItems.length > 0 && setItems) {
            setItems(prev => updatedItems.reduce((nextItems, updatedItem) => (
              mergeUpdatedItem(nextItems, updatedItem)
            ), prev));
          }
          if (usedRows.length > 0 && setTxs) {
            setTxs(prev => [
              ...buildSurgeryUsageTxs({ usedRows, itemMap, surgery, surgeryId, note, currentUser, usageConfirmedAt }),
              ...prev,
            ]);
          }
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          auditLogsApi.record({
            action: "surgery.usage_confirmed",
            entityType: "surgery",
            entityId: surgeryId,
            actor: currentUser,
            metadata: auditMetadata,
            at: usageConfirmedAt,
          });
          setNotifs(p=>[usageNotification,...p]);
          showToast(successToast);
        })
        .catch(error => {
          handleAppError(error, {
            context: "surgeries.usageConfirm",
            userMessage: "수술 실사용량 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    if (usedRows.length > 0 && setItems) {
      setItems(prev => prev.map(item => qtyByItemId.has(item.id)
        ? { ...item, current_qty: item.current_qty - qtyByItemId.get(item.id) }
        : item
      ));
    }

    if (usedRows.length > 0 && setTxs) {
      setTxs(prev => [
        ...buildSurgeryUsageTxs({ usedRows, itemMap, surgery, surgeryId, note, currentUser, usageConfirmedAt }),
        ...prev,
      ]);
    }

    setSurgeries(p=>p.map(s=>s.id===surgeryId?{
      ...s,
      usage_confirmed:true,
      usage_confirmed_by:currentUser.name,
      usage_confirmed_at:usageConfirmedAt,
      actual_items:usageRows,
      usage_note:note,
    }:s));

    auditLogsApi.record({
      action: "surgery.usage_confirmed",
      entityType: "surgery",
      entityId: surgeryId,
      actor: currentUser,
      metadata: auditMetadata,
      at: usageConfirmedAt,
    });
    setNotifs(p=>[usageNotification,...p]);
    showToast(successToast);
  }, [canConfirmSurgery, currentUser, items, setItems, setNotifs, setSurgeries, setTxs, showToast, surgeries]);

  return useMemo(() => ({ confirmSurgeryUsage }), [confirmSurgeryUsage]);
}
