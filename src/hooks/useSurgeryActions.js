import { useEffect } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseSurgeriesApi } from "../api/supabaseSurgeriesApi";
import { can } from "../constants/permissions";
import { SURGERY_PRESETS } from "../constants/surgeryPresets";
import { handleAppError } from "../utils/errorHandling";
import { todayKey } from "../utils/helpers";

function mergeUpdatedItem(prevItems, updatedItem) {
  return prevItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item);
}

export function useSurgeryActions({ surgeries, setSurgeries, items = [], setItems, setTxs, setNotifs, currentUser, showToast, firePush, firedRemindersRef }) {
  const canManageSurgery = can(currentUser?.role, "surgery_manage");
  const canConfirmSurgery = can(currentUser?.role, "surgery_confirm");

  const addSurgery = (data) => {
    if (!canManageSurgery) {
      showToast("수술 일정 관리 권한이 없습니다.");
      return;
    }

    const preset = SURGERY_PRESETS[data.type] || SURGERY_PRESETS.implant;
    const requiredItems = (data.required_items && data.required_items.length) ? data.required_items : preset.items;
    const surgery = {
      id:`s${Date.now()}`,
      title:data.title || preset.label,
      patient:data.patient || "-",
      type:data.type,
      scheduled_date:data.scheduled_date,
      scheduled_time:data.scheduled_time,
      note:data.note,
      required_items:requiredItems,
      created_by:currentUser.name,
      prep_confirmed:false,
      prepared_by:null,
      prepared_at:null,
      usage_confirmed:false,
      usage_confirmed_by:null,
      usage_confirmed_at:null,
      actual_items:null,
    };

    if (supabaseSurgeriesApi.isEnabled()) {
      void supabaseSurgeriesApi.createSurgery(currentUser.clinicId, surgery, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>[savedSurgery,...p]);
          auditLogsApi.record({
            action: "surgery.created",
            entityType: "surgery",
            entityId: savedSurgery.id,
            actor: currentUser,
            metadata: {
              type: savedSurgery.type,
              scheduled_date: savedSurgery.scheduled_date,
              scheduled_time: savedSurgery.scheduled_time,
              required_count: savedSurgery.required_items.length,
              has_patient: Boolean(savedSurgery.patient && savedSurgery.patient !== "-"),
            },
          });
          if (savedSurgery.scheduled_date===todayKey()) {
            setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_today", surgery_id:savedSurgery.id, item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:`${savedSurgery.title} · ${savedSurgery.scheduled_time}`, is_read:false, created_at:new Date().toISOString()},...p]);
            firePush(`today:${savedSurgery.id}`, "오늘 수술 일정", `${savedSurgery.title} · ${savedSurgery.scheduled_time}`);
          }
          showToast("수술 일정이 등록되었습니다.");
        })
        .catch(error => {
          handleAppError(error, {
            context: "surgeries.create",
            userMessage: "수술 일정 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setSurgeries(p=>[surgery,...p]);
    auditLogsApi.record({
      action: "surgery.created",
      entityType: "surgery",
      entityId: surgery.id,
      actor: currentUser,
      metadata: {
        type: surgery.type,
        scheduled_date: surgery.scheduled_date,
        scheduled_time: surgery.scheduled_time,
        required_count: surgery.required_items.length,
        has_patient: Boolean(surgery.patient && surgery.patient !== "-"),
      },
    });
    if (surgery.scheduled_date===todayKey()) {
      setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_today", surgery_id:surgery.id, item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:`${surgery.title} · ${surgery.scheduled_time}`, is_read:false, created_at:new Date().toISOString()},...p]);
      firePush(`today:${surgery.id}`, "오늘 수술 일정", `${surgery.title} · ${surgery.scheduled_time}`);
    }
    showToast("수술 일정이 등록되었습니다.");
  };

  const confirmSurgeryPrep = (surgeryId) => {
    if (!canConfirmSurgery) {
      showToast("수술 준비 확인 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;
    const preparedAt = new Date().toISOString();

    if (supabaseSurgeriesApi.isEnabled()) {
      const nextSurgery = {...surgery, prep_confirmed:true, prepared_by:currentUser.name, prepared_at:preparedAt};
      void supabaseSurgeriesApi.updateSurgery(surgery, nextSurgery, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          auditLogsApi.record({
            action: "surgery.prep_confirmed",
            entityType: "surgery",
            entityId: surgeryId,
            actor: currentUser,
            metadata: { scheduled_date: surgery.scheduled_date, scheduled_time: surgery.scheduled_time },
            at: preparedAt,
          });
          setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_ready", surgery_id:surgeryId, item_id:null, message:"수술 준비 확인이 완료되었습니다", sub:`${surgery.title} · ${currentUser.name}`, is_read:false, created_at:new Date().toISOString()},...p]);
          showToast("수술 준비가 확인되었습니다.");
        })
        .catch(error => {
          handleAppError(error, {
            context: "surgeries.prepConfirm",
            userMessage: "수술 준비 확인 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, prep_confirmed:true, prepared_by:currentUser.name, prepared_at:preparedAt}:s));
    auditLogsApi.record({
      action: "surgery.prep_confirmed",
      entityType: "surgery",
      entityId: surgeryId,
      actor: currentUser,
      metadata: { scheduled_date: surgery.scheduled_date, scheduled_time: surgery.scheduled_time },
      at: preparedAt,
    });
    setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_ready", surgery_id:surgeryId, item_id:null, message:"수술 준비 확인이 완료되었습니다", sub:`${surgery.title} · ${currentUser.name}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("수술 준비가 확인되었습니다.");
  };

  const updateSurgeryItems = (surgeryId, newItems) => {
    if (!canManageSurgery) {
      showToast("수술 준비 품목 수정 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);

    if (supabaseSurgeriesApi.isEnabled() && surgery) {
      void supabaseSurgeriesApi.updateSurgery(surgery, { ...surgery, required_items:newItems }, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          auditLogsApi.record({
            action: "surgery.items_updated",
            entityType: "surgery",
            entityId: surgeryId,
            actor: currentUser,
            metadata: {
              before_count: surgery?.required_items?.length ?? 0,
              after_count: newItems.length,
            },
          });
          showToast("준비 품목이 수정되었습니다.");
        })
        .catch(error => {
          handleAppError(error, {
            context: "surgeries.itemsUpdate",
            userMessage: "준비 품목 저장에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, required_items:newItems}:s));
    auditLogsApi.record({
      action: "surgery.items_updated",
      entityType: "surgery",
      entityId: surgeryId,
      actor: currentUser,
      metadata: {
        before_count: surgery?.required_items?.length ?? 0,
        after_count: newItems.length,
      },
    });
    showToast("준비 품목이 수정되었습니다.");
  };

  const confirmSurgeryUsage = (surgeryId, usageItems, note = "") => {
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
              ...usedRows.map((row, index) => {
                const item = itemMap.get(row.item_id);
                return {
                  id: `t${Date.now()}-s${index}`,
                  item_id: row.item_id,
                  type: "out",
                  qty: row.qty,
                  note: `수술 실사용 확정 (${surgery.title})${note ? ` · ${note}` : ""}`,
                  created_at: usageConfirmedAt,
                  user: currentUser.name,
                  surgery_id: surgeryId,
                  item_name: item?.name,
                };
              }),
              ...prev,
            ]);
          }
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          auditLogsApi.record({
            action: "surgery.usage_confirmed",
            entityType: "surgery",
            entityId: surgeryId,
            actor: currentUser,
            metadata: {
              scheduled_date: surgery.scheduled_date,
              scheduled_time: surgery.scheduled_time,
              used_count: usedRows.length,
              used_items: usedRows.map(row => {
                const item = itemMap.get(row.item_id);
                return `${item?.name || row.item_id}:${row.qty}${item?.unit || ""}`;
              }).join(", "),
              note: note || "",
            },
            at: usageConfirmedAt,
          });
          setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_usage", surgery_id:surgeryId, item_id:null, message:"수술 실사용량 확인이 완료되었습니다", sub:`${surgery.title} · ${usedRows.length}개 품목 출고`, is_read:false, created_at:usageConfirmedAt},...p]);
          showToast(usedRows.length ? `실사용 ${usedRows.length}개 품목 출고 완료` : "사용 품목 없이 수술을 완료했습니다");
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
        ...usedRows.map((row, index) => {
          const item = itemMap.get(row.item_id);
          return {
            id: `t${Date.now()}-s${index}`,
            item_id: row.item_id,
            type: "out",
            qty: row.qty,
            note: `수술 실사용 확정 (${surgery.title})${note ? ` · ${note}` : ""}`,
            created_at: usageConfirmedAt,
            user: currentUser.name,
            surgery_id: surgeryId,
            item_name: item?.name,
          };
        }),
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
      metadata: {
        scheduled_date: surgery.scheduled_date,
        scheduled_time: surgery.scheduled_time,
        used_count: usedRows.length,
        used_items: usedRows.map(row => {
          const item = itemMap.get(row.item_id);
          return `${item?.name || row.item_id}:${row.qty}${item?.unit || ""}`;
        }).join(", "),
        note: note || "",
      },
      at: usageConfirmedAt,
    });
    setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_usage", surgery_id:surgeryId, item_id:null, message:"수술 실사용량 확인이 완료되었습니다", sub:`${surgery.title} · ${usedRows.length}개 품목 출고`, is_read:false, created_at:usageConfirmedAt},...p]);
    showToast(usedRows.length ? `실사용 ${usedRows.length}개 품목 출고 완료` : "사용 품목 없이 수술을 완료했습니다");
  };

  const deleteSurgery = (surgeryId) => {
    if (!canManageSurgery) {
      showToast("수술 일정 삭제 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;

    if (supabaseSurgeriesApi.isEnabled()) {
      void supabaseSurgeriesApi.cancelSurgery(surgery, currentUser)
        .then(() => {
          setSurgeries(p=>p.filter(s=>s.id!==surgeryId));
          setNotifs(p=>p.filter(n=>n.surgery_id!==surgeryId));
          firedRemindersRef.current.delete(surgeryId);
          auditLogsApi.record({
            action: "surgery.deleted",
            entityType: "surgery",
            entityId: surgeryId,
            actor: currentUser,
            metadata: {
              scheduled_date: surgery.scheduled_date,
              scheduled_time: surgery.scheduled_time,
              required_count: surgery.required_items.length,
              had_patient: Boolean(surgery.patient && surgery.patient !== "-"),
            },
          });
          showToast("수술 일정이 삭제되었습니다.");
        })
        .catch(error => {
          handleAppError(error, {
            context: "surgeries.delete",
            userMessage: "수술 일정 삭제에 실패했습니다. 다시 시도해주세요.",
            showToast,
          });
        });
      return;
    }

    setSurgeries(p=>p.filter(s=>s.id!==surgeryId));
    setNotifs(p=>p.filter(n=>n.surgery_id!==surgeryId));
    firedRemindersRef.current.delete(surgeryId);
    auditLogsApi.record({
      action: "surgery.deleted",
      entityType: "surgery",
      entityId: surgeryId,
      actor: currentUser,
      metadata: {
        scheduled_date: surgery.scheduled_date,
        scheduled_time: surgery.scheduled_time,
        required_count: surgery.required_items.length,
        had_patient: Boolean(surgery.patient && surgery.patient !== "-"),
      },
    });
    showToast("수술 일정이 삭제되었습니다.");
  };

  // ── 로그인 직후: 브라우저 푸쉬 권한 요청 + 당일 수술 인앱 알림 자동 생성 ──
  useEffect(() => {
    const today = todayKey();
    const todays = surgeries.filter(s=>s.scheduled_date===today);
    if (todays.length === 0) return;
    setNotifs(p => {
      const existing = new Set(p.filter(n=>n.type==="surgery_today"&&n.surgery_id).map(n=>n.surgery_id));
      const missing = todays.filter(s=>!existing.has(s.id));
      if (missing.length === 0) return p;
      const created = missing.map(s=>({
        id:`n${Date.now()}-${s.id}`, type:"surgery_today", surgery_id:s.id, item_id:null,
        message:"오늘 예정된 수술 준비가 필요합니다",
        sub:`${s.title} · ${s.scheduled_time}`,
        is_read:false, created_at:new Date().toISOString(),
      }));
      return [...created, ...p];
    });
    todays.forEach(s => firePush(`today:${s.id}`, "오늘 수술 일정", `${s.title} · ${s.scheduled_time}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 30분 전 미준비 리마인더 ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      surgeries.forEach(s => {
        if (s.prep_confirmed) return;
        if (s.scheduled_date !== todayKey()) return;
        const start = new Date(`${s.scheduled_date}T${s.scheduled_time}`);
        const diffMin = (start - now) / 60000;
        if (diffMin > 0 && diffMin <= 30 && !firedRemindersRef.current.has(s.id)) {
          firedRemindersRef.current.add(s.id);
          const mins = Math.ceil(diffMin);
          setNotifs(p => [{
            id:`n${Date.now()}-r${s.id}`, type:"surgery_reminder", surgery_id:s.id, item_id:null,
            message:`${mins}분 후 수술 시작 — 준비 미완료`,
            sub:`${s.title} · ${s.scheduled_time}`,
            is_read:false, created_at:new Date().toISOString(),
          }, ...p]);
          firePush(`reminder:${s.id}`, "수술 임박 — 준비 미완료", `${s.title} · ${s.scheduled_time}`);
        }
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surgeries]);

  return { addSurgery, confirmSurgeryPrep, confirmSurgeryUsage, updateSurgeryItems, deleteSurgery };
}
