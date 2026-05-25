import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Coins, ExternalLink, XCircle } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { can } from "../../../constants/permissions";
import { getVendorPriceCandidates } from "../../../utils/vendorSelection";
import { Card } from "../../shared/Card";
import { formatCurrency, formatLastChecked, getApprovalDecision } from "../../shared/ShippingOrderCard/shippingOrderCard.utils";

function CompactActionButton({ variant = "primary", disabled = false, children, ...props }) {
  const variants = {
    primary: { border: "none", background: T.primary, color: T.white },
    neutral: { border: `1.5px solid ${T.grey300}`, background: T.white, color: T.grey700 },
    danger: { border: `1.5px solid ${T.danger}55`, background: T.white, color: T.danger },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 44,
        borderRadius: 9999,
        padding: "10px 8px",
        fontFamily: font,
        fontSize: 14,
        fontWeight: 800,
        lineHeight: "18px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        whiteSpace: "nowrap",
        ...variants[variant],
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function PendingApprovalCard({
  order,
  item,
  canApprove,
  selected,
  onSelectChange,
  priceChecking,
  onPriceCheck,
  duplicateInfo,
  monthlyProjectedAmount,
  actionAvailability,
  currentUser,
  onActionClick,
}) {
  const [expanded, setExpanded] = useState(false);
  const decision = getApprovalDecision(order, item, duplicateInfo, monthlyProjectedAmount);
  const candidates = getVendorPriceCandidates(item, order.qty);
  const visibleCandidates = candidates.slice(0, 3);
  const canViewPriceData = can(currentUser?.role, "cost_view") || can(currentUser?.role, "orders_price_check");
  const canApproveAction = canApprove && actionAvailability?.approve?.allowed;
  const canHold = canApprove && actionAvailability?.hold?.allowed;
  const canReject = canApprove && actionAvailability?.reject?.allowed;
  const approvalBlocked = actionAvailability?.approve?.requiresOwnerApproval && !actionAvailability?.approve?.allowed;
  const importantChecks = decision.checklist.filter(row => {
    const value = String(row.value || "");
    return value.includes("필요") || value.includes("없음") || value.includes("부족") || value.includes("원장");
  }).slice(0, 2);
  const visibleChecklist = canViewPriceData
    ? decision.checklist
    : decision.checklist.filter(row => !["최저가/가격", "한도 추정"].includes(row.label));
  const hasCheckableUrl = candidates.some(candidate => candidate.vendor_url);

  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {canApprove && (
            <button
              type="button"
              onClick={onSelectChange}
              aria-label={`${item.name} 선택`}
              style={{
                width: 28,
                height: 28,
                marginTop: 1,
                borderRadius: 9999,
                border: `1.5px solid ${selected ? T.primary : T.grey300}`,
                background: selected ? T.primary : T.white,
                color: T.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {selected && <CheckCircle2 size={18} strokeWidth={3} />}
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: "21px", fontWeight: 900, color: T.grey900, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                  {item.name}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>
                  {order.qty}{item.unit}
                  {order.requested_by && ` · ${order.requested_by}`}
                </p>
              </div>
              <span style={{ flexShrink: 0, borderRadius: 9999, padding: "5px 8px", background: decision.decision.bg, color: decision.decision.color, fontSize: 12, lineHeight: "16px", fontWeight: 900 }}>
                {decision.decision.label}
              </span>
            </div>

            <div style={{ marginTop: 10, borderRadius: 12, background: T.grey50, padding: "10px 12px" }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: "19px", fontWeight: 900, color: decision.decision.color, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                {decision.decision.gateLabel} · {decision.nextAction}
              </p>
              {importantChecks.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {importantChecks.map(row => (
                    <span key={row.label} style={{ borderRadius: 9999, padding: "4px 7px", background: T.white, color: row.color, fontSize: 12, lineHeight: "16px", fontWeight: 800 }}>
                      {row.label} {row.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {canApprove ? (
          <div style={{ display: "flex", alignItems: "stretch", gap: 7, marginTop: 12 }}>
            <CompactActionButton variant="danger" onClick={() => onActionClick("reject")} disabled={!canReject}>
              <XCircle size={16} />
              반려
            </CompactActionButton>
            <CompactActionButton variant="neutral" onClick={() => onActionClick("hold")} disabled={!canHold}>
              <AlertTriangle size={16} />
              보류
            </CompactActionButton>
            <CompactActionButton onClick={() => onActionClick("approve")} disabled={!canApproveAction}>
              <CheckCircle2 size={16} />
              {approvalBlocked ? "원장 필요" : canApproveAction ? "승인" : "권한 없음"}
            </CompactActionButton>
          </div>
        ) : (
          <div style={{ marginTop: 12, padding: "11px 12px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 14, fontWeight: 800 }}>
            관리자 검토를 기다리는 중입니다
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{ width: "100%", marginTop: 10, minHeight: 38, border: "none", background: T.white, color: T.grey600, fontFamily: font, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          {canViewPriceData ? "상세 근거·가격 후보" : "상세 근거"}
          <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.grey100}`, padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {canViewPriceData && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <Coins size={17} color={T.primary} style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: T.grey900 }}>가격 후보</p>
                </div>
                {canApprove && (
                  <button
                    type="button"
                    onClick={onPriceCheck}
                    disabled={!hasCheckableUrl || priceChecking}
                    style={{ flexShrink: 0, minHeight: 32, borderRadius: 9999, border: `1px solid ${hasCheckableUrl ? T.grey300 : T.grey200}`, background: T.white, color: hasCheckableUrl ? T.grey700 : T.grey400, fontFamily: font, fontSize: 12, fontWeight: 800, padding: "0 10px", cursor: hasCheckableUrl && !priceChecking ? "pointer" : "default", display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <ExternalLink size={14} />
                    {priceChecking ? "확인 중" : "가격 확인"}
                  </button>
                )}
              </div>

              {visibleCandidates.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {visibleCandidates.map((candidate, index) => {
                    const isBest = index === 0 && candidate.vendor_in_stock && Number.isFinite(Number(candidate.vendor_price));
                    return (
                      <div key={`${candidate.vendor_id}-${candidate.vendor_url || index}`} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, background: isBest ? T.primaryBg : T.grey50, padding: "9px 10px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9999, background: candidate.vendor_in_stock ? (isBest ? T.primary : T.grey400) : T.danger, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: T.grey800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {candidate.vendor_name || "거래처 미정"}{isBest ? " · 최저" : ""}
                            {!candidate.vendor_in_stock && " · 품절"}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            기본 {formatCurrency(candidate.vendor_base_price)} · {formatLastChecked(candidate.vendor_last_checked_at)}
                          </p>
                        </div>
                        <p style={{ margin: 0, flexShrink: 0, fontFamily: monoFont, fontSize: 13, fontWeight: 900, color: isBest ? T.primary : T.grey800 }}>
                          {formatCurrency(candidate.vendor_price)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, borderRadius: 12, background: T.grey50, padding: "10px 12px", fontSize: 13, lineHeight: 1.45, color: T.grey500 }}>
                  등록된 구매 후보가 없습니다.
                </p>
              )}
            </>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 }}>
            {visibleChecklist.map(row => (
              <div key={row.label} style={{ borderRadius: 12, border: `1px solid ${T.grey100}`, padding: "9px 10px", background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: T.grey500 }}>{row.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.3, fontWeight: 900, color: row.color, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {order.note && (
            <p style={{ margin: 0, borderRadius: 12, background: T.grey50, padding: "10px 12px", fontSize: 13, lineHeight: 1.45, color: T.grey600, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
              메모: {order.note}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
