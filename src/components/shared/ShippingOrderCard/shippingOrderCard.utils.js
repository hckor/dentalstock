import { T } from "../../../constants/colors";
import { getShippingEvents } from "../../../utils/shippingEvents";
import { getVendorPriceCandidates } from "../../../utils/vendorSelection";

const singleOrderOwnerReviewAmount = 100000;
const monthlyOwnerReviewAmount = 500000;
const shippingDelayReferenceTime = Date.now();
const dayMs = 86400000;

export function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return "가격 미확인";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export function formatCompactCurrency(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return "가격 미확인";
  if (Math.abs(next) >= 10000) return `${Math.round(next / 10000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(next).toLocaleString("ko-KR")}원`;
}

export function getSelectedUnitPrice(order, item) {
  if (Number.isFinite(Number(order.vendor_price))) return Number(order.vendor_price);
  const candidates = getVendorPriceCandidates(item, order.qty);
  const firstCandidate = candidates.find(candidate => Number.isFinite(Number(candidate.vendor_price)));
  if (firstCandidate) return Number(firstCandidate.vendor_price);
  return Number(item.price) || null;
}

export function getPriceReviewSignal(order, item) {
  const candidates = getVendorPriceCandidates(item, order.qty);
  const hasOrderPrice = Number.isFinite(Number(order.vendor_price)) && Number(order.vendor_price) > 0;
  const pricedCandidate = candidates.find(candidate => candidate.vendor_in_stock && Number.isFinite(Number(candidate.vendor_price)) && Number(candidate.vendor_price) > 0);
  const hasCheckedCandidate = candidates.some(candidate => candidate.vendor_last_checked_at);
  const hasCheckableUrl = candidates.some(candidate => candidate.vendor_url);

  if (hasOrderPrice || pricedCandidate) {
    return {
      needsReview: !hasCheckedCandidate,
      label: hasCheckedCandidate ? "가격 확인됨" : "실시간 가격 미확인",
      reason: hasCheckedCandidate ? "최근 확인 가격을 기준으로 승인할 수 있습니다" : "저장 가격은 있으나 최근 가격확인 이력이 없습니다",
      nextAction: hasCheckedCandidate
        ? "승인 또는 반려를 결정"
        : hasCheckableUrl
          ? "가격 확인 버튼을 눌러 최신가 확인"
          : "품목 관리에서 후보 URL 등록 후 최신가 확인",
    };
  }

  if (candidates.length === 0) {
    return {
      needsReview: true,
      label: "가격 후보 없음",
      reason: "등록된 구매 후보가 없어 승인 금액을 비교하기 어렵습니다",
      nextAction: "후보 URL/거래처 등록 후 승인 검토",
    };
  }

  return {
    needsReview: true,
    label: "가격 확인 필요",
    reason: "후보는 있지만 재고 있거나 유효한 가격 후보가 없습니다",
    nextAction: hasCheckableUrl ? "가격 확인 또는 거래처 후보 수정" : "거래처 후보 URL/가격 정보 수정",
  };
}

export function getDuplicateReviewSignal(duplicateInfo, item) {
  if (!duplicateInfo?.hasDuplicate) return null;
  const parts = [];
  if (duplicateInfo.orderedCount > 0) parts.push(`진행중 ${duplicateInfo.orderedQty}${item.unit}`);
  if (duplicateInfo.pendingCount > 0) parts.push(`승인대기 ${duplicateInfo.pendingQty}${item.unit}`);
  return {
    label: "중복 발주 검토",
    reason: `같은 품목이 이미 ${parts.join(" · ")} 있습니다`,
    nextAction: duplicateInfo.orderedCount > 0
      ? "진행중 탭에서 배송/입고 상태 먼저 확인"
      : "같은 요청은 묶어서 승인하거나 하나만 승인",
  };
}

export function getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount = 0) {
  const candidates = getVendorPriceCandidates(item, order.qty);
  const selectedUnitPrice = getSelectedUnitPrice(order, item);
  const selectedAmount = Number.isFinite(Number(selectedUnitPrice)) ? Number(selectedUnitPrice) * Number(order.qty || 0) : null;
  const bestCandidate = candidates.find(candidate => candidate.vendor_in_stock && Number.isFinite(Number(candidate.vendor_price)));
  const selectedVendorId = String(order.vendor_id || "");
  const selectedCandidate = selectedVendorId
    ? candidates.find(candidate => String(candidate.vendor_id || "") === selectedVendorId)
    : bestCandidate;
  const isLowestCandidate = Boolean(bestCandidate && selectedCandidate && String(bestCandidate.vendor_id || "") === String(selectedCandidate.vendor_id || ""));
  const highestPrice = Math.max(0, ...candidates.map(candidate => Number(candidate.vendor_price) || 0));
  const bestSavings = bestCandidate && highestPrice > bestCandidate.vendor_price
    ? (highestPrice - bestCandidate.vendor_price) * Number(order.qty || 0)
    : 0;
  const stockGap = Number(item.min_qty || 0) - Number(item.current_qty || 0);
  const isLowStock = stockGap > 0;
  const isOverstock = Number(item.current_qty || 0) > Math.max(Number(item.min_qty || 0) * 2, Number(item.min_qty || 0) + 3);
  const hasPriceCandidate = candidates.length > 0;
  const priceSignal = getPriceReviewSignal(order, item);
  const duplicateSignal = getDuplicateReviewSignal(duplicateInfo, item);
  const singleLimitExceeded = selectedAmount !== null && selectedAmount >= singleOrderOwnerReviewAmount;
  const monthlyLimitExceeded = Number(monthlyProjectedAmount) >= monthlyOwnerReviewAmount;
  const missingPriceCandidate = !hasPriceCandidate || priceSignal.label === "가격 후보 없음";
  const ownerReviewReasons = [
    ...(singleLimitExceeded ? [`1회 ${formatCompactCurrency(singleOrderOwnerReviewAmount)} 이상`] : []),
    ...(missingPriceCandidate ? ["가격 후보 없음"] : []),
    ...(duplicateSignal ? ["중복 발주"] : []),
    ...(monthlyLimitExceeded ? [`월 ${formatCompactCurrency(monthlyOwnerReviewAmount)} 초과 가능`] : []),
  ];
  const requiresOwnerApproval = ownerReviewReasons.length > 0;
  const hasOrderedDuplicate = Number(duplicateInfo?.orderedCount || 0) > 0;
  const hasPendingDuplicate = Number(duplicateInfo?.pendingCount || 0) > 0;
  const recommendation = requiresOwnerApproval
    ? { label: "보류 추천", color: T.purple500, bg: T.purple50, summary: "매니저 단독 승인 불가" }
    : priceSignal.needsReview
      ? { label: "보류 추천", color: T.orange500, bg: T.orange50, summary: "가격 확인 후 재판단" }
      : isLowStock
        ? { label: "승인 추천", color: T.blue500, bg: T.blue50, summary: "재고 보충 필요" }
        : isOverstock
          ? { label: "반려 검토", color: T.red500, bg: T.red50, summary: "현재 재고 충분" }
          : { label: "보류 추천", color: T.grey700, bg: T.grey100, summary: "긴급도 낮음" };
  const gateLabel = requiresOwnerApproval
    ? "원장 승인 필요"
    : "매니저 승인 가능";
  const decision = { ...recommendation, gateLabel };
  const reason = requiresOwnerApproval
    ? ownerReviewReasons.join(" · ")
    : duplicateSignal?.reason ||
      (priceSignal.needsReview ? priceSignal.reason :
        isLowStock ? `최소수량보다 ${stockGap}${item.unit} 부족합니다` :
          isOverstock ? "현재 재고가 최소 기준보다 충분히 많습니다" :
            "재고는 기준 범위 안에 있어 급한 발주는 아닙니다");
  const nextAction = requiresOwnerApproval
    ? "보류로 넘기고 원장 검토 후 승인"
    : duplicateSignal?.nextAction ||
      (priceSignal.needsReview ? priceSignal.nextAction :
        isLowStock ? "최저가 후보 확인 후 승인" :
          isOverstock ? "필요 시 반려하고 기존 재고 먼저 사용" :
            "가격 후보와 사용 예정일 확인 후 승인/반려 선택");
  const recommendationDetail = requiresOwnerApproval
    ? `원장 검토 사유: ${ownerReviewReasons.join(" · ")}`
    : hasOrderedDuplicate
      ? "이미 진행중인 발주가 있어 먼저 입고 가능성을 확인하세요"
      : hasPendingDuplicate
        ? "같은 품목 승인대기 요청과 묶을 수 있는지 확인하세요"
        : priceSignal.needsReview
          ? priceSignal.reason
          : recommendation.summary;
  const checklist = [
    {
      label: "부족 여부",
      value: isLowStock ? `${stockGap}${item.unit} 부족` : "기준 범위",
      detail: `현재 ${item.current_qty}${item.unit} · 최소 ${item.min_qty}${item.unit}`,
      color: isLowStock ? T.red500 : T.green500,
    },
    {
      label: "중복 발주",
      value: duplicateSignal ? "검토 필요" : "중복 없음",
      detail: duplicateSignal?.reason || "같은 품목 진행/대기 없음",
      color: duplicateSignal ? T.red500 : T.green500,
    },
    {
      label: "최저가/가격",
      value: !hasPriceCandidate ? "후보 없음" : priceSignal.needsReview ? "확인 필요" : isLowestCandidate ? "최저가 후보" : "가격 확인됨",
      detail: priceSignal.reason,
      color: !hasPriceCandidate || priceSignal.needsReview ? T.orange500 : T.blue500,
    },
    {
      label: "한도 추정",
      value: singleLimitExceeded || monthlyLimitExceeded ? "원장 확인" : "한도 내",
      detail: `1회 ${selectedAmount === null ? "미확인" : formatCompactCurrency(selectedAmount)} · 월 ${formatCompactCurrency(monthlyProjectedAmount)}`,
      color: singleLimitExceeded || monthlyLimitExceeded ? T.purple500 : T.green500,
    },
    {
      label: "원장 승인",
      value: requiresOwnerApproval ? "필요" : "불필요",
      detail: requiresOwnerApproval ? ownerReviewReasons.join(" · ") : "매니저 승인 가능",
      color: requiresOwnerApproval ? T.purple500 : T.green500,
    },
  ];

  return {
    decision,
    duplicateSignal,
    priceSignal,
    checklist,
    requiresOwnerApproval,
    ownerReviewReasons,
    reason,
    nextAction,
    selectedAmount,
    bestSavings,
    recommendationDetail,
    stockLabel: isLowStock
      ? `최소보다 ${stockGap}${item.unit} 부족`
      : isOverstock
        ? `최소 기준보다 여유 ${Number(item.current_qty || 0) - Number(item.min_qty || 0)}${item.unit}`
        : `현재 ${item.current_qty}${item.unit} · 최소 ${item.min_qty}${item.unit}`,
    vendorLabel: hasPriceCandidate
      ? bestCandidate
        ? `${bestCandidate.vendor_name || "거래처"} 최저 후보`
        : "가격 후보 품절/미확인"
      : "가격 후보 없음",
  };
}

function getDaysSince(value) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((shippingDelayReferenceTime - parsed) / dayMs));
}

function getDeliveredAt(order) {
  if (order.delivery_completed_at) return order.delivery_completed_at;
  return getShippingEvents(order).find(event => event.status === "배달완료")?.timestamp || null;
}

export function getShippingDelaySignal(order) {
  if (order?.status !== "ordered") return null;
  const orderedAt = order.reviewed_at || order.requested_at;
  const orderedDays = getDaysSince(orderedAt);
  const deliveredAt = getDeliveredAt(order);
  const deliveredDays = getDaysSince(deliveredAt);

  if (deliveredAt && deliveredDays !== null && deliveredDays >= 1) {
    return {
      tone: "danger",
      title: "배송완료 후 입고 미확인",
      body: `도착 후 ${deliveredDays}일 지났습니다 · 입고 수량 확인 필요`,
    };
  }

  if (!order.tracking_number && orderedDays !== null && orderedDays >= 3) {
    return {
      tone: "warning",
      title: "송장 등록 지연",
      body: `승인 후 ${orderedDays}일째 송장이 없습니다 · 거래처/송장 확인 필요`,
    };
  }

  if (orderedDays !== null && orderedDays >= 5) {
    return {
      tone: "warning",
      title: "입고 지연 가능성",
      body: `발주 후 ${orderedDays}일째 입고 전입니다 · 배송 상태 확인 필요`,
    };
  }

  return null;
}

export function formatLastChecked(value) {
  if (!value) return "확인 전";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "확인 전";
  return `${parsed.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${parsed.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}
