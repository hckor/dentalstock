import { CATEGORIES } from "../constants/categories";
import { T } from "../constants/colors";

// ─── HELPERS ──────────────────────────────────────────
export const getStatus = (i) => i.current_qty<=0?"danger":i.current_qty<i.min_qty?"warning":"ok";

export const catName  = (id) => CATEGORIES.find(c=>c.id===id)?.name  || "-";
export const catColor = (id) => CATEGORIES.find(c=>c.id===id)?.color || T.grey400;
export const daysUntil = (d) => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
export const dateKey = (date = new Date(), timeZone = "Asia/Seoul") => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};
export const todayKey = () => dateKey();
export const fmtDate  = (s) => new Date(s).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"});
export const fmtFull  = (s) => new Date(s).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
export const initials = (n) => n.slice(0,1);

// 특정 품목의 활성 발주 (pending | ordered) 찾기
export const getActiveOrder = (orders, itemId) =>
  orders.find(o => o.item_id===itemId && (o.status==="pending"||o.status==="ordered")) || null;

export const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;
