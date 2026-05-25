import { dateKey } from "../../../utils/helpers";

export const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isTodayValue = (value, today) => {
  const date = toValidDate(value);
  return date ? dateKey(date) === today : false;
};

export const formatRelativeActivity = (value) => {
  const date = toValidDate(value);
  if (!date) return "활동 없음";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", {month:"2-digit", day:"2-digit"});
};

export const compactCount = (value) => value > 99 ? "99+" : String(value);
