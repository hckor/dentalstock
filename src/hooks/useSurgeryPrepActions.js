import { useCallback, useMemo } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { supabaseSurgeriesApi } from "../api/supabaseSurgeriesApi";
import { handleAppError } from "../utils/errorHandling";

export function useSurgeryPrepActions({
  canConfirmSurgery,
  surgeries,
  setSurgeries,
  setNotifs,
  currentUser,
  showToast,
}) {
  const confirmSurgeryPrep = useCallback((surgeryId) => {
    if (!canConfirmSurgery) {
      showToast("수술 준비 확인 권한이 없습니다.");
      return;
    }

    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;
    const preparedAt = new Date().toISOString();

    const recordPrepared = () => {
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

    if (supabaseSurgeriesApi.isEnabled()) {
      const nextSurgery = {...surgery, prep_confirmed:true, prepared_by:currentUser.name, prepared_at:preparedAt};
      void supabaseSurgeriesApi.updateSurgery(surgery, nextSurgery, currentUser)
        .then(savedSurgery => {
          setSurgeries(p=>p.map(s=>s.id===surgeryId?savedSurgery:s));
          recordPrepared();
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
    recordPrepared();
  }, [canConfirmSurgery, currentUser, setNotifs, setSurgeries, showToast, surgeries]);

  return useMemo(() => ({ confirmSurgeryPrep }), [confirmSurgeryPrep]);
}
