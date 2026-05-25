import { useEffect } from "react";
import { todayKey } from "../utils/helpers";

export function useSurgeryReminderEffects({ surgeries, setNotifs, firePush, firedRemindersRef }) {
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
}
