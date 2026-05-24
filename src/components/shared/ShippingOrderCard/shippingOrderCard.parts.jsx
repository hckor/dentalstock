import { AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { getVendorPriceCandidates } from "../../../utils/vendorSelection";
import { Chip } from "../Chip";
import {
  actionButtonBase,
  actionButtonVariants,
  candidateBadgeBaseStyle,
  candidateBadgeVariants,
  candidateDotBaseStyle,
  candidateMetaStyle,
  candidateNameRowStyle,
  candidateNameStyle,
  candidatePriceStyle,
  checklistGridStyle,
  checklistLabelStyle,
  checklistRowStyle,
  checklistValueStyle,
  contentStyle,
  decisionConclusionStyle,
  decisionLeadStyle,
  decisionOneLineStyle,
  emptyCandidateStyle,
  headerStyle,
  iconStyle,
  nextActionLabelStyle,
  nextActionStyle,
  nextActionTextStyle,
  priceCandidateListStyle,
  priceCandidateRowBaseStyle,
  pricePanelHeaderStyle,
  pricePanelStyle,
  pricePanelSubtitleStyle,
  pricePanelTitleStyle,
  reviewNoticeBaseStyle,
  reviewNoticeToneStyles,
  selectToggleBaseStyle,
  titleStyle,
} from "./shippingOrderCard.styles";
import {
  formatCompactCurrency,
  formatCurrency,
  formatLastChecked,
  getApprovalDecision,
} from "./shippingOrderCard.utils";

export function ActionButton({ variant = "primary", style, children, disabled = false, ...props }) {
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

export function StatusHeader({ item, statusMeta, children, compact = false }) {
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

export function PriceCandidatePanel({ item, order, canApprove, checking = false, onPriceCheck }) {
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

export function ApprovalDecisionPanel({ order, item, duplicateInfo, monthlyProjectedAmount = 0 }) {
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

export function ReviewNotice({ tone = "warning", title, body }) {
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

export function ApprovalActionNotices({ order, item, duplicateInfo, monthlyProjectedAmount = 0, currentUser }) {
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

export function SelectToggle({ itemName, selected, onChange }) {
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
