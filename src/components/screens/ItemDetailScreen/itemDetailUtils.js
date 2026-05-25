import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock3, ShoppingCart, SlidersHorizontal, TrendingUp } from "lucide-react";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { catName, fmtDate, fmtFull } from "../../../utils/helpers";
import { compactMoney as formatMoney, toNumber } from "../../../utils/money";

const DAY = 86400000;

export function safeDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function inLastDays(value, days) {
  const date = safeDate(value);
  if (!date) return false;
  return Date.now() - date.getTime() <= days * DAY;
}

export function formatCheckedAt(value) {
  const date = safeDate(value);
  if (!date) return "확인 전";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export function buildPriceHistoryRows(priceOptions, itemOrders, item) {
  const monitorRows = priceOptions.map((option, index) => {
    const listPrice = toNumber(option.list_price_krw ?? option.list_price);
    const delta = listPrice > 0 ? option.price - listPrice : 0;
    const hasDelta = listPrice > 0 && delta !== 0;
    return {
      id: `monitor-${option.vendor_id || option.vendor_name || index}`,
      title: option.vendor_name || "거래처",
      badge: index === 0 ? "최저 후보" : "감시 가격",
      date: option.last_checked_at,
      amount: formatMoney(option.price),
      detail: hasDelta
        ? `정가 ${formatMoney(listPrice)} 대비 ${delta < 0 ? "-" : "+"}${formatMoney(Math.abs(delta))}`
        : option.in_stock === false
          ? "품절 신호가 감지됨"
          : "최근 감시 가격",
      color: hasDelta ? (delta < 0 ? T.green500 : T.orange500) : index === 0 ? T.green500 : T.grey700,
      bg: hasDelta ? (delta < 0 ? T.green50 : T.orange50) : index === 0 ? T.green50 : T.grey100,
    };
  });

  const orderRows = itemOrders
    .filter(order => toNumber(order.vendor_price) > 0)
    .slice(0, 3)
    .map(order => ({
      id: `order-${order.id}`,
      title: order.vendor_name || "발주 단가",
      badge: ORDER_ST[order.status]?.short || "발주",
      date: order.reviewed_at || order.requested_at,
      amount: formatMoney(order.vendor_price),
      detail: `${order.qty}${item?.unit || ""} 요청 · ${order.requested_by || "담당자"}`,
      color: T.blue500,
      bg: T.blue50,
    }));

  return [...monitorRows, ...orderRows]
    .sort((a, b) => (safeDate(b.date)?.getTime() || 0) - (safeDate(a.date)?.getTime() || 0))
    .slice(0, 6);
}

export function buildTimelineRows({ item, st, ao, activeOrderMeta, shortageQty, latestTx, lastReviewedOrder, receivedOrder }) {
  return [
    {
      label: "재고 상태",
      badge: st === "ok" ? "정상" : st === "danger" ? "품절" : "부족",
      detail: st === "ok"
        ? `현재 ${item.current_qty}${item.unit}로 최소 ${item.min_qty}${item.unit} 이상입니다.`
        : `최소보다 ${Math.max(1, shortageQty)}${item.unit} 부족합니다.`,
      Icon: st === "ok" ? CheckCircle2 : AlertTriangle,
      color: st === "ok" ? T.green500 : T.red500,
      bg: st === "ok" ? T.green50 : T.red50,
    },
    {
      label: "발주 흐름",
      badge: ao ? activeOrderMeta.label : st === "ok" ? "대기 없음" : "요청 필요",
      detail: ao
        ? `${ao.requested_by || "담당자"} 요청 · ${ao.qty}${item.unit} · ${fmtDate(ao.requested_at)}`
        : st === "ok"
          ? "진행 중인 발주는 없고 재고 기준도 안정적입니다."
          : "진행 중인 발주가 없어 발주 요청이 필요합니다.",
      Icon: ShoppingCart,
      color: ao ? activeOrderMeta.text : st === "ok" ? T.green500 : T.orange500,
      bg: ao ? activeOrderMeta.bg : st === "ok" ? T.green50 : T.orange50,
    },
    {
      label: "승인/입고",
      badge: receivedOrder ? "입고 완료" : lastReviewedOrder ? "검토 완료" : ao?.status === "pending" ? "승인 대기" : "기록 없음",
      detail: receivedOrder
        ? `${fmtDate(receivedOrder.received_at || receivedOrder.reviewed_at)} 입고 완료`
        : lastReviewedOrder
          ? `${lastReviewedOrder.reviewed_by || "검토자"} · ${ORDER_ST[lastReviewedOrder.status]?.label || lastReviewedOrder.status}`
          : ao?.status === "pending"
            ? "매니저 또는 원장 검토 후 배송 흐름으로 넘어갑니다."
            : "최근 승인/입고 기록이 없습니다.",
      Icon: receivedOrder ? CheckCircle2 : Clock3,
      color: receivedOrder ? T.green500 : lastReviewedOrder ? T.blue500 : T.grey600,
      bg: receivedOrder ? T.green50 : lastReviewedOrder ? T.blue50 : T.grey100,
    },
    {
      label: "최근 입출고",
      badge: latestTx ? (latestTx.type === "in" ? "입고" : latestTx.type === "out" ? "출고" : "보정") : "이력 없음",
      detail: latestTx
        ? `${latestTx.note || (latestTx.type === "in" ? "입고" : latestTx.type === "out" ? "출고" : "재고 보정")} · ${latestTx.user} · ${fmtFull(latestTx.created_at)}`
        : "아직 이 품목의 입출고 기록이 없습니다.",
      Icon: latestTx?.type === "in" ? ArrowDownToLine : latestTx?.type === "out" ? ArrowUpFromLine : SlidersHorizontal,
      color: latestTx?.type === "in" ? T.blue500 : latestTx?.type === "out" ? T.red500 : T.grey600,
      bg: latestTx?.type === "in" ? T.blue50 : latestTx?.type === "out" ? T.red50 : T.grey100,
    },
  ];
}

export function buildShortageInsights({ item, ao, activeOrderMeta, shortageQty, recentOut7, recentOut30, recommendedMinQty }) {
  return [
    shortageQty > 0 && {
      label: "최소 재고 미달",
      detail: `현재 ${item.current_qty}${item.unit}, 최소 ${item.min_qty}${item.unit}라서 ${shortageQty}${item.unit} 보충이 필요합니다.`,
      Icon: AlertTriangle,
      color: T.red500,
      bg: T.red50,
    },
    recentOut7 > 0 && {
      label: "최근 사용량",
      detail: `최근 7일 출고 ${recentOut7}${item.unit}, 최근 30일 출고 ${recentOut30}${item.unit}입니다.`,
      Icon: TrendingUp,
      color: T.blue500,
      bg: T.blue50,
    },
    ao && {
      label: "중복 발주 방지",
      detail: `${ao.qty}${item.unit} 발주가 이미 ${activeOrderMeta.label} 상태라 추가 요청 전 진행 상태를 확인하세요.`,
      Icon: ShoppingCart,
      color: T.teal500,
      bg: T.teal50,
    },
    recommendedMinQty > toNumber(item.min_qty) && {
      label: "최소 재고 추천",
      detail: `최근 사용량 기준 추천 최소수량은 ${recommendedMinQty}${item.unit}입니다. 현재 기준보다 ${recommendedMinQty - toNumber(item.min_qty)}${item.unit} 높아요.`,
      Icon: SlidersHorizontal,
      color: T.purple500,
      bg: T.purple50,
    },
  ].filter(Boolean);
}

export function buildInfoRows({ item, lastOrder }) {
  return [
    {label:"카테고리", value:catName(item.category_id)},
    {label:"보관 위치",  value:item.location || "-"},
    ...(item.expiry ? [{label:"유통기한", value:item.expiry.replace(/-/g,".")}] : []),
    ...(lastOrder ? [{label:"최근 발주", value:`${lastOrder.requested_by} · ${fmtDate(lastOrder.requested_at)}`}] : []),
  ];
}
