import { memo } from "react";
import { CheckCircle2, ChevronRight, FileText, Navigation, RefreshCw, XCircle } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
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

function ActionButton({ variant = "primary", style, children, ...props }) {
  return (
    <button {...props} style={{ ...actionButtonBase, ...actionButtonVariants[variant], ...style }}>
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

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick, selectable = false, selected = false, onSelectChange, priceChecking = false, onPriceCheck }) {
  const os = ORDER_ST[order.status];
  const vendorLabel = getVendorLabel(order);

  if (!item) return null;

  const renderStageContent = () => {
    switch (stage) {
      case "auto_wait": {
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

            {canApprove ? (
              <div style={actionRowStyle}>
                <ActionButton variant="dangerOutline" onClick={() => onActionClick("reject")}>
                  <XCircle size={18} style={iconStyle} />
                  반려
                </ActionButton>
                <ActionButton onClick={() => onActionClick("approve")}>
                  <CheckCircle2 size={18} style={iconStyle} />
                  승인
                </ActionButton>
              </div>
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
