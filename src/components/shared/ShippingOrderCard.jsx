import { memo } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, Navigation, RefreshCw, XCircle } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { can } from "../../constants/permissions";
import { getShippingEvents } from "../../utils/shippingEvents";
import { getVendorLabel, getVendorPriceCandidates } from "../../utils/vendorSelection";
import { Card } from "./Card";
import { Chip } from "./Chip";

const bodyStyle = { padding: "18px 20px" };
const headerStyle = { display: "flex", alignItems: "flex-start", gap: 12 };
const titleStyle = { margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 };
const metaStyle = { margin: "4px 0 0", fontSize: 16, color: T.grey500 };
const emphasisStyle = { fontWeight: 600, color: T.grey700 };
const contentStyle = { flex: 1, minWidth: 0 };
const iconStyle = { flexShrink: 0 };
const actionRowStyle = { display: "flex", alignItems: "stretch", gap: 8 };
const noticeStyle = { padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 };
const stackedActionStyle = { display: "flex", flexDirection: "column", gap: 8 };
const trackingNumberStyle = { margin: "6px 0 0", fontSize: 16, color: T.grey600, fontFamily: "monospace", fontWeight: 500 };
const actionButtonBase = {
  flex: 1,
  minWidth: 0,
  padding: "12px 12px",
  borderRadius: 9999,
  cursor: "pointer",
  fontFamily: font,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  whiteSpace: "nowrap",
  wordBreak: "keep-all",
};

const actionButtonVariants = {
  primary: { border: "none", background: T.blue500, color: T.white },
  dangerOutline: { border: `1.5px solid ${T.red500}55`, background: T.white, color: T.red500 },
  neutralOutline: { border: `1.5px solid ${T.grey300}`, background: T.white, color: T.grey700 },
};

const pricePanelStyle = { margin: "2px 0 14px", borderRadius: 14, background: T.grey50, padding: "12px 14px" };
const pricePanelHeaderStyle = { display: "flex", alignItems: "center", gap: 10 };
const pricePanelTitleStyle = { margin: 0, fontSize: 14, fontWeight: 700, color: T.grey900 };
const pricePanelSubtitleStyle = { margin: "3px 0 0", fontSize: 13, color: T.grey500 };
const priceCandidateListStyle = { display: "flex", flexDirection: "column", gap: 7 };
const priceCandidateRowBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "9px 10px",
  borderRadius: 12,
};
const candidateDotBaseStyle = { width: 8, height: 8, borderRadius: 9999, flexShrink: 0 };
const candidateNameRowStyle = { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
const candidateNameStyle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: T.grey800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};
const candidateMetaStyle = { margin: "2px 0 0", fontSize: 12, color: T.grey500 };
const candidatePriceStyle = { margin: 0, flexShrink: 0, fontFamily: monoFont, fontSize: 14, fontWeight: 700 };
const candidateBadgeBaseStyle = { borderRadius: 9999, padding: "2px 7px", fontSize: 11, fontWeight: 700 };
const candidateBadgeVariants = {
  best: { background: T.blue50, color: T.blue500 },
  soldOut: { background: T.red50, color: T.red500 },
};
const emptyCandidateStyle = { margin: "10px 0 0", fontSize: 13, color: T.grey500, lineHeight: 1.45 };
const selectToggleBaseStyle = {
  width: 26,
  height: 26,
  marginTop: 1,
  borderRadius: 9999,
  color: T.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const reviewNoticeBaseStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  padding: "10px 12px",
  borderRadius: 12,
  margin: "0 0 10px",
};
const reviewNoticeToneStyles = {
  warning: { border: `1px solid ${T.orange500}33`, background: T.orange50, color: T.orange500 },
  danger: { border: `1px solid ${T.red500}33`, background: T.red50, color: T.red500 },
};
const holdStatusMeta = { bg: T.holdBg, text: T.hold, border: T.holdLine, label: "보류됨", short: "보류" };
const singleOrderOwnerReviewAmount = 100000;
const monthlyOwnerReviewAmount = 500000;
const shippingDelayReferenceTime = Date.now();
const dayMs = 86400000;
const checklistGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 7 };
const checklistRowStyle = { borderRadius: 12, border: `1px solid ${T.grey100}`, padding: "9px 10px", background: T.grey50 };
const checklistLabelStyle = { margin: 0, fontSize: 12, fontWeight: 800, color: T.grey500 };
const checklistValueStyle = { margin: "4px 0 0", fontSize: 13, fontWeight: 800, lineHeight: 1.3, wordBreak: "keep-all", overflowWrap: "anywhere" };
const decisionLeadStyle = { padding: "14px", background: T.white, display: "flex", flexDirection: "column", gap: 10 };
const decisionConclusionStyle = { margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 900, wordBreak: "keep-all" };
const decisionOneLineStyle = { margin: "4px 0 0", fontSize: 13, lineHeight: 1.45, color: T.grey600, wordBreak: "keep-all", overflowWrap: "anywhere" };
const nextActionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  borderRadius: 12,
  padding: "10px 12px",
  background: T.grey50,
  color: T.grey800,
};
const nextActionLabelStyle = { margin: 0, flexShrink: 0, fontSize: 12, fontWeight: 900, color: T.grey500 };
const nextActionTextStyle = { margin: 0, minWidth: 0, fontSize: 13, lineHeight: 1.4, fontWeight: 800, color: T.grey900, wordBreak: "keep-all", overflowWrap: "anywhere" };

function ActionButton({ variant = "primary", style, children, disabled = false, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...actionButtonBase,
        ...actionButtonVariants[variant],
        ...(disabled ? { border: `1.5px solid ${T.grey200}`, background: T.grey200, color: T.grey500, cursor: "default" } : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function StatusHeader({ item, statusMeta, children, compact = false }) {
  return (
    <div style={{ ...headerStyle, marginBottom: compact ? 0 : 14 }}>
      <div style={contentStyle}>
        <p style={titleStyle}>{item.name}</p>
        {children}
      </div>
      <Chip label={statusMeta.label} color={statusMeta.text} bg={statusMeta.bg} />
    </div>
  );
}

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return "가격 미확인";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function formatCompactCurrency(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return "가격 미확인";
  if (Math.abs(next) >= 10000) return `${Math.round(next / 10000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(next).toLocaleString("ko-KR")}원`;
}

function getSelectedUnitPrice(order, item) {
  if (Number.isFinite(Number(order.vendor_price))) return Number(order.vendor_price);
  const candidates = getVendorPriceCandidates(item, order.qty);
  const firstCandidate = candidates.find(candidate => Number.isFinite(Number(candidate.vendor_price)));
  if (firstCandidate) return Number(firstCandidate.vendor_price);
  return Number(item.price) || null;
}

function getPriceReviewSignal(order, item) {
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

function getDuplicateReviewSignal(duplicateInfo, item) {
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

function getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount = 0) {
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

function getShippingDelaySignal(order) {
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

function formatLastChecked(value) {
  if (!value) return "확인 전";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "확인 전";
  return `${parsed.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${parsed.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}

function CandidateBadge({ variant, children }) {
  return <span style={{ ...candidateBadgeBaseStyle, ...candidateBadgeVariants[variant] }}>{children}</span>;
}

function PriceCheckButton({ checking, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 34,
        padding: "7px 11px",
        borderRadius: 9999,
        border: "none",
        background: disabled ? T.grey200 : T.blue50,
        color: disabled ? T.grey500 : T.blue500,
        fontFamily: font,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      <RefreshCw size={15} style={iconStyle} />
      {checking ? "확인 중" : "가격 확인"}
    </button>
  );
}

function PriceCandidateRow({ candidate, isBest }) {
  const stockColor = candidate.vendor_in_stock ? (isBest ? T.blue500 : T.grey400) : T.red500;

  return (
    <div
      style={{
        ...priceCandidateRowBaseStyle,
        background: isBest ? T.white : "transparent",
        border: isBest ? `1px solid ${T.blue500}22` : `1px solid ${T.grey100}`,
      }}
    >
      <span style={{ ...candidateDotBaseStyle, background: stockColor }} />
      <div style={contentStyle}>
        <div style={candidateNameRowStyle}>
          <p style={candidateNameStyle}>{candidate.vendor_name || "거래처 미정"}</p>
          {isBest && <CandidateBadge variant="best">최저</CandidateBadge>}
          {!candidate.vendor_in_stock && <CandidateBadge variant="soldOut">품절</CandidateBadge>}
        </div>
        <p style={candidateMetaStyle}>
          기본 {formatCurrency(candidate.vendor_base_price)} · 배송 {formatCurrency(candidate.vendor_shipping_fee)} · {formatLastChecked(candidate.vendor_last_checked_at)}
        </p>
      </div>
      <p style={{ ...candidatePriceStyle, color: isBest ? T.blue500 : T.grey800 }}>
        {formatCurrency(candidate.vendor_price)}
      </p>
    </div>
  );
}

function PriceCandidatePanel({ item, order, canApprove, checking = false, onPriceCheck }) {
  const candidates = getVendorPriceCandidates(item, order.qty);
  const visibleCandidates = candidates.slice(0, 3);
  const hasCheckableUrl = candidates.some(candidate => candidate.vendor_url);
  const canRunCheck = Boolean(onPriceCheck) && hasCheckableUrl && !checking;

  return (
    <div style={pricePanelStyle}>
      <div style={{ ...pricePanelHeaderStyle, marginBottom: visibleCandidates.length ? 10 : 0 }}>
        <div style={contentStyle}>
          <p style={pricePanelTitleStyle}>품목별 가격 확인</p>
          <p style={pricePanelSubtitleStyle}>승인 전에 최저가 후보를 확인합니다</p>
        </div>
        {canApprove && (
          <PriceCheckButton checking={checking} disabled={!canRunCheck} onClick={onPriceCheck} />
        )}
      </div>

      {visibleCandidates.length > 0 ? (
        <div style={priceCandidateListStyle}>
          {visibleCandidates.map((candidate, index) => {
            const isBest = index === 0 && candidate.vendor_in_stock && Number.isFinite(Number(candidate.vendor_price));
            return (
              <PriceCandidateRow
                key={`${candidate.vendor_id}-${candidate.vendor_url || index}`}
                candidate={candidate}
                isBest={isBest}
              />
            );
          })}
        </div>
      ) : (
        <p style={emptyCandidateStyle}>
          구매 후보가 아직 없습니다. 품목 편집에서 후보 거래처와 상품 URL을 등록하면 승인 전에 가격을 확인할 수 있어요.
        </p>
      )}
    </div>
  );
}

function ApprovalDecisionPanel({ order, item, duplicateInfo, monthlyProjectedAmount = 0 }) {
  const decision = getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount);
  const rows = [
    { label: "이번 승인 금액", value: decision.selectedAmount === null ? "가격 미확인" : formatCompactCurrency(decision.selectedAmount), color: T.grey900 },
    { label: "승인 권한", value: decision.decision.gateLabel, color: decision.requiresOwnerApproval ? T.purple500 : T.green500 },
    { label: "거래처", value: decision.bestSavings > 0 ? `${decision.vendorLabel} · ${formatCurrency(decision.bestSavings)} 절감 여지` : decision.vendorLabel, color: T.blue500 },
  ];

  return (
    <div style={{ margin: "0 0 14px", borderRadius: 14, border: `1px solid ${decision.decision.color}22`, background: T.white, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: decision.decision.bg }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.grey900 }}>승인 판단</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.grey600 }}>{decision.stockLabel}</p>
        </div>
        <span style={{ flexShrink: 0, borderRadius: 9999, padding: "5px 9px", background: T.white, color: decision.decision.color, fontSize: 12, fontWeight: 800 }}>
          {decision.decision.gateLabel}
        </span>
      </div>
      <div style={decisionLeadStyle}>
        <div>
          <p style={{ ...decisionConclusionStyle, color: decision.decision.color }}>{decision.decision.label}</p>
          <p style={decisionOneLineStyle}>{decision.reason}</p>
        </div>
        <div style={{ ...nextActionStyle, background: decision.decision.bg }}>
          <ChevronRight size={17} color={decision.decision.color} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={nextActionLabelStyle}>다음 행동</p>
          <p style={nextActionTextStyle}>{decision.nextAction}</p>
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, fontWeight: 700, color: T.grey500, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
          {decision.recommendationDetail}
        </p>
        {rows.map(row => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ flexShrink: 0, fontSize: 13, color: T.grey500, fontWeight: 700 }}>{row.label}</span>
            <span style={{ minWidth: 0, textAlign: "right", fontSize: 13, lineHeight: 1.35, color: row.color, fontWeight: 800, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{row.value}</span>
          </div>
        ))}
        <div style={checklistGridStyle}>
          {decision.checklist.map(row => (
            <div key={row.label} style={checklistRowStyle}>
              <p style={checklistLabelStyle}>{row.label}</p>
              <p style={{ ...checklistValueStyle, color: row.color }}>{row.value}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.35, color: T.grey500, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{row.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewNotice({ tone = "warning", title, body }) {
  return (
    <div style={{ ...reviewNoticeBaseStyle, ...reviewNoticeToneStyles[tone] }}>
      <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: reviewNoticeToneStyles[tone].color }}>{title}</p>
        <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.4, color: T.grey700, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{body}</p>
      </div>
    </div>
  );
}

function ApprovalActionNotices({ order, item, duplicateInfo, monthlyProjectedAmount = 0, currentUser }) {
  const decision = getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount);
  const notices = [];
  if (decision.requiresOwnerApproval && currentUser?.role !== "owner") {
    notices.push({
      key: "owner-review",
      tone: "warning",
      title: "원장 승인 필요",
      body: `${decision.ownerReviewReasons.join(" · ")} · 보류로 넘긴 뒤 원장이 승인해야 합니다`,
    });
  }
  if (decision.duplicateSignal) {
    notices.push({
      key: "duplicate",
      tone: "danger",
      title: decision.duplicateSignal.label,
      body: `${decision.duplicateSignal.reason} · ${decision.duplicateSignal.nextAction}`,
    });
  }
  if (decision.priceSignal.needsReview) {
    notices.push({
      key: "price",
      tone: "warning",
      title: decision.priceSignal.label,
      body: `${decision.priceSignal.reason} · ${decision.priceSignal.nextAction}`,
    });
  }
  if (!notices.length) return null;
  return (
    <>
      {notices.map(notice => (
        <ReviewNotice key={notice.key} tone={notice.tone} title={notice.title} body={notice.body} />
      ))}
    </>
  );
}

function SelectToggle({ itemName, selected, onChange }) {
  return (
    <button
      type="button"
      aria-label={`${itemName} 일괄 승인 선택`}
      aria-pressed={selected}
      onClick={onChange}
      style={{
        ...selectToggleBaseStyle,
        border: `1px solid ${selected ? T.blue500 : T.grey300}`,
        background: selected ? T.blue500 : T.white,
      }}
    >
      {selected && <CheckCircle2 size={17} color={T.white} strokeWidth={3} />}
    </button>
  );
}

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick, selectable = false, selected = false, onSelectChange, priceChecking = false, onPriceCheck, duplicateInfo = null, monthlyProjectedAmount = 0, currentUser = null }) {
  const os = ORDER_ST[order.status] || holdStatusMeta;
  const vendorLabel = getVendorLabel(order);

  if (!item) return null;

  const renderStageContent = () => {
    switch (stage) {
      case "hold":
      case "auto_wait": {
        const decision = getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount);
        const canStandardApprove = canApprove && can(currentUser?.role, "orders_approve_standard");
        const canOwnerReviewApprove = canApprove && can(currentUser?.role, "orders_approve_owner_review");
        const canHold = canApprove && can(currentUser?.role, "orders_hold");
        const canReject = canApprove && can(currentUser?.role, "orders_reject");
        const approvalBlocked = decision.requiresOwnerApproval && !canOwnerReviewApprove;
        const isOnHold = stage === "hold";
        return (
          <div style={bodyStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: selectable ? 10 : 0 }}>
              {selectable && (
                <SelectToggle itemName={item.name} selected={selected} onChange={onSelectChange} />
              )}
              <div style={contentStyle}>
                <StatusHeader item={item} statusMeta={os}>
                  <p style={metaStyle}>
                    <span style={emphasisStyle}>수량:</span> {order.qty}{item.unit}
                    {order.requested_by && ` · 요청자: ${order.requested_by}`}
                  </p>
                  <p style={metaStyle}>예상 거래처: {vendorLabel}</p>
                  {order.note && <p style={metaStyle}>메모: {order.note}</p>}
                  {isOnHold && order.review_note && <p style={metaStyle}>보류 사유: {order.review_note}</p>}
                </StatusHeader>
              </div>
            </div>

            <PriceCandidatePanel
              item={item}
              order={order}
              canApprove={canApprove}
              checking={priceChecking}
              onPriceCheck={onPriceCheck}
            />

            <ApprovalDecisionPanel order={order} item={item} duplicateInfo={duplicateInfo} monthlyProjectedAmount={monthlyProjectedAmount} />

            {canApprove ? (
              <>
                <ApprovalActionNotices order={order} item={item} duplicateInfo={duplicateInfo} monthlyProjectedAmount={monthlyProjectedAmount} currentUser={currentUser} />
                <div style={actionRowStyle}>
                  <ActionButton variant="dangerOutline" onClick={() => onActionClick("reject")} disabled={!canReject}>
                    <XCircle size={18} style={iconStyle} />
                    반려
                  </ActionButton>
                  <ActionButton variant="neutralOutline" onClick={() => onActionClick("hold")} disabled={!canHold}>
                    <AlertTriangle size={18} style={iconStyle} />
                    보류
                  </ActionButton>
                  <ActionButton onClick={() => onActionClick("approve")} disabled={!canStandardApprove || approvalBlocked}>
                    <CheckCircle2 size={18} style={iconStyle} />
                    {!canStandardApprove ? "권한 없음" : approvalBlocked ? "원장 필요" : "승인"}
                  </ActionButton>
                </div>
              </>
            ) : (
              <div style={noticeStyle}>관리자 검토를 기다리는 중입니다</div>
            )}
          </div>
        );
      }

      case "in_transit": {
        const hasTracking = !!order.tracking_number;
        const latestShippingEvent = getShippingEvents(order)[0];
        const isDelivered = latestShippingEvent?.status === "배달완료";
        const delaySignal = getShippingDelaySignal(order);
        return (
          <div style={bodyStyle}>
            <StatusHeader item={item} statusMeta={os}>
              <p style={metaStyle}>
                <span style={{ fontWeight: 600, color: isDelivered ? T.green500 : T.teal500 }}>
                  {hasTracking ? (isDelivered ? "배달완료" : latestShippingEvent?.status || "배송 추적 중") : "송장 미등록"}
                </span>
                {order.carrier && ` · ${order.carrier}`}
              </p>
              <p style={metaStyle}>거래처: {vendorLabel}</p>
              {Number(order.received_qty) > 0 && (
                <p style={metaStyle}>
                  부분입고 <span style={{ fontWeight: 700, color: T.orange500 }}>{order.received_qty}/{order.qty}{item.unit}</span>
                </p>
              )}
              {order.tracking_number && (
                <p style={trackingNumberStyle}>
                  송장: {order.tracking_number}
                </p>
              )}
            </StatusHeader>

            {delaySignal && (
              <ReviewNotice tone={delaySignal.tone} title={delaySignal.title} body={delaySignal.body} />
            )}

            {(hasTracking || canApprove) && (
              <div style={stackedActionStyle}>
                <div style={actionRowStyle}>
                  <ActionButton
                    variant="neutralOutline"
                    onClick={() => onActionClick(hasTracking ? "tracking_detail" : "tracking_start")}
                  >
                    {hasTracking ? <FileText size={18} style={iconStyle} /> : <Navigation size={18} style={iconStyle} />}
                    {hasTracking ? "송장 상세" : "송장 등록"}
                    {hasTracking && <ChevronRight size={18} style={iconStyle} />}
                  </ActionButton>
                  {hasTracking && canApprove && (
                    <ActionButton variant="neutralOutline" onClick={() => onActionClick("tracking_refresh")}>
                      <RefreshCw size={18} style={iconStyle} />
                      배송 갱신
                    </ActionButton>
                  )}
                </div>
                {canApprove && (
                  <ActionButton onClick={() => onActionClick("confirm_receipt")} style={{ width: "100%" }}>
                    <CheckCircle2 size={18} style={iconStyle} />
                    입고 확인
                  </ActionButton>
                )}
              </div>
            )}
            {!hasTracking && !canApprove && (
              <div style={noticeStyle}>송장 등록을 기다리는 중입니다</div>
            )}
          </div>
        );
      }

      case "rejected": {
        return (
          <div style={bodyStyle}>
            <StatusHeader item={item} statusMeta={os} compact>
              <p style={metaStyle}>
                수량 <span style={emphasisStyle}>{order.qty}{item.unit}</span>
                {order.review_note && ` · ${order.review_note}`}
              </p>
            </StatusHeader>
          </div>
        );
      }

      case "completed": {
        return (
          <div style={bodyStyle}>
            <StatusHeader item={item} statusMeta={os} compact>
              <p style={metaStyle}>
                수량 <span style={emphasisStyle}>{order.qty}{item.unit}</span>
                {order.requested_by && ` · 요청자: ${order.requested_by}`}
              </p>
              <p style={metaStyle}>거래처: {vendorLabel}</p>
              {order.reviewed_by && (
                <p style={metaStyle}>
                  <span style={{ fontWeight: 600, color: T.green500 }}>✓ 입고 완료</span>
                  {` · ${order.reviewed_by}`}
                </p>
              )}
            </StatusHeader>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return <Card style={{ overflow: "hidden" }}>{renderStageContent()}</Card>;
});
