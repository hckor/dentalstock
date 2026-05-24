import { useMemo } from "react";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { dateKey, todayKey } from "../../../utils/helpers";

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

export function useStaffSummaries({ users, items, txs, orders, surgeries }) {
  const staffSummaries = useMemo(() => {
    const today = todayKey();
    const itemMap = new Map(items.map(item => [item.id, item]));

    return users.map(user => {
      const userName = user.name;
      const stockTxs = txs.filter(tx => tx.user === userName);
      const orderRequests = orders.filter(order => order.requested_by === userName);
      const orderReviews = orders.filter(order => order.reviewed_by === userName && order.reviewed_at);
      const prepConfirmations = surgeries.filter(surgery => surgery.prepared_by === userName && surgery.prepared_at);
      const usageConfirmations = surgeries.filter(surgery => surgery.usage_confirmed_by === userName && surgery.usage_confirmed_at);

      const activities = [
        ...stockTxs.map(tx => {
          const item = itemMap.get(tx.item_id);
          return {
            at: tx.created_at,
            title: tx.type === "in" ? "입고 등록" : "출고 등록",
            detail: item?.name || tx.item_name || "재고 기록",
            color: tx.type === "in" ? T.primary : T.danger,
          };
        }),
        ...orderRequests.map(order => {
          const item = itemMap.get(order.item_id);
          return {
            at: order.requested_at,
            title: "발주 요청",
            detail: item?.name || "품목 미지정",
            color: ORDER_ST.pending.text,
          };
        }),
        ...orderReviews.map(order => {
          const item = itemMap.get(order.item_id);
          return {
            at: order.reviewed_at,
            title: order.status === "rejected" ? "발주 반려" : "발주 승인",
            detail: item?.name || "품목 미지정",
            color: order.status === "rejected" ? ORDER_ST.rejected.text : ORDER_ST.ordered.text,
          };
        }),
        ...prepConfirmations.map(surgery => ({
          at: surgery.prepared_at,
          title: "수술 준비 확인",
          detail: surgery.title || "수술 일정",
          color: T.success,
        })),
        ...usageConfirmations.map(surgery => ({
          at: surgery.usage_confirmed_at,
          title: "실사용량 확인",
          detail: surgery.title || "수술 일정",
          color: T.success,
        })),
      ]
        .filter(activity => toValidDate(activity.at))
        .sort((a, b) => toValidDate(b.at).getTime() - toValidDate(a.at).getTime());

      return {
        userId: user.id,
        todayStockTxs: stockTxs.filter(tx => isTodayValue(tx.created_at, today)).length,
        todayOrderRequests: orderRequests.filter(order => isTodayValue(order.requested_at, today)).length,
        todayPrepConfirmations: prepConfirmations.filter(surgery => isTodayValue(surgery.prepared_at, today)).length,
        recentActivities: activities.slice(0, 3),
        lastActivity: activities[0] || null,
      };
    });
  }, [items, orders, surgeries, txs, users]);

  const staffSummaryById = useMemo(
    () => new Map(staffSummaries.map(summary => [summary.userId, summary])),
    [staffSummaries]
  );

  const todayStaffTotals = useMemo(() => staffSummaries.reduce((totals, summary) => ({
    stock: totals.stock + summary.todayStockTxs,
    orders: totals.orders + summary.todayOrderRequests,
    prep: totals.prep + summary.todayPrepConfirmations,
  }), {stock:0, orders:0, prep:0}), [staffSummaries]);

  return { staffSummaries, staffSummaryById, todayStaffTotals };
}
