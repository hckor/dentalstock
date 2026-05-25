import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseSurgeriesApi } from "../api/supabaseSurgeriesApi";
import { SURGERY_PRESETS } from "../constants/surgeryPresets";
import { handleAppError } from "../utils/errorHandling";
import { todayKey } from "../utils/helpers";
import { buildSurgeryTodayNotification } from "./surgeryActionShared";

export function useSurgeryScheduleActions({
  canManageSurgery,
  surgeries,
  setSurgeries,
  setNotifs,
  currentUser,
  showToast,
  firePush,
  firedRemindersRef,
}) {
  const addSurgery = useCallback((data) => {
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

    const recordCreated = (savedSurgery) => {
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
        setNotifs(p=>[buildSurgeryTodayNotification(savedSurgery),...p]);
        firePush(`today:${savedSurgery.id}`, "오늘 수술 일정", `${savedSurgery.title} · ${savedSurgery.scheduled_time}`);
      }
      showToast("수술 일정이 등록되었습니다.");
    };

    if (supabaseSurgeriesApi.isEnabled()) {
      void supabaseSurgeriesApi.createSurgery(currentUser.clinicId, surgery, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>[savedSurgery,...p]);
          recordCreated(savedSurgery);
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
    recordCreated(surgery);
  }, [canManageSurgery, currentUser, firePush, setNotifs, setSurgeries, showToast]);

  const updateSurgeryItems = useCallback((surgeryId, newItems) => {
    if (!canManageSurgery) {
      showToast("수술 준비 품목 수정 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);

    const recordUpdated = (targetSurgery = surgery) => {
      auditLogsApi.record({
        action: "surgery.items_updated",
        entityType: "surgery",
        entityId: surgeryId,
        actor: currentUser,
        metadata: {
          before_count: targetSurgery?.required_items?.length ?? 0,
          after_count: newItems.length,
        },
      });
      showToast("준비 품목이 수정되었습니다.");
    };

    if (supabaseSurgeriesApi.isEnabled() && surgery) {
      void supabaseSurgeriesApi.updateSurgery(surgery, { ...surgery, required_items:newItems }, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          recordUpdated(surgery);
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
    recordUpdated(surgery);
  }, [canManageSurgery, currentUser, setSurgeries, showToast, surgeries]);

  const deleteSurgery = useCallback((surgeryId) => {
    if (!canManageSurgery) {
      showToast("수술 일정 삭제 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;

    const recordDeleted = () => {
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

    if (supabaseSurgeriesApi.isEnabled()) {
      void supabaseSurgeriesApi.cancelSurgery(surgery, currentUser)
        .then(() => {
          setSurgeries(p=>p.filter(s=>s.id!==surgeryId));
          setNotifs(p=>p.filter(n=>n.surgery_id!==surgeryId));
          firedRemindersRef.current.delete(surgeryId);
          recordDeleted();
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
    recordDeleted();
  }, [canManageSurgery, currentUser, firedRemindersRef, setNotifs, setSurgeries, showToast, surgeries]);

  return useMemo(() => ({
    addSurgery,
    updateSurgeryItems,
    deleteSurgery,
  }), [addSurgery, deleteSurgery, updateSurgeryItems]);
}
