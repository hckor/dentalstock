import { memo } from "react";
import { CheckCircle2, ChevronRight, FileText, Navigation, RefreshCw, XCircle } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { getShippingEvents } from "../../utils/shippingEvents";
import { getVendorLabel } from "../../utils/vendorSelection";
import { Card } from "./Card";
import { Chip } from "./Chip";

const bodyStyle = { padding: "18px 20px" };
const headerStyle = { display: "flex", alignItems: "flex-start", gap: 12 };
const titleStyle = { margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 };
const metaStyle = { margin: "4px 0 0", fontSize: 16, color: T.grey500 };
const actionRowStyle = { display: "flex", alignItems: "stretch", gap: 8 };
const noticeStyle = { padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 };
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={titleStyle}>{item.name}</p>
        {children}
      </div>
      <Chip label={statusMeta.label} color={statusMeta.text} bg={statusMeta.bg} />
    </div>
  );
}

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick, selectable = false, selected = false, onSelectChange }) {
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
                <button
                  type="button"
                  aria-label={`${item.name} 일괄 승인 선택`}
                  aria-pressed={selected}
                  onClick={onSelectChange}
                  style={{
                    width: 26,
                    height: 26,
                    marginTop: 1,
                    borderRadius: 9999,
                    border: `1px solid ${selected ? T.blue500 : T.grey300}`,
                    background: selected ? T.blue500 : T.white,
                    color: T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {selected && <CheckCircle2 size={17} color={T.white} strokeWidth={3} />}
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <StatusHeader item={item} statusMeta={os}>
                  <p style={metaStyle}>
                    <span style={{ fontWeight: 600, color: T.grey700 }}>수량:</span> {order.qty}{item.unit}
                    {order.requested_by && ` · 요청자: ${order.requested_by}`}
                  </p>
                  <p style={metaStyle}>예상 거래처: {vendorLabel}</p>
                  {order.note && <p style={metaStyle}>메모: {order.note}</p>}
                </StatusHeader>
              </div>
            </div>

            {canApprove ? (
              <div style={actionRowStyle}>
                <ActionButton variant="dangerOutline" onClick={() => onActionClick("reject")}>
                  <XCircle size={18} style={{ flexShrink: 0 }} />
                  반려
                </ActionButton>
                <ActionButton onClick={() => onActionClick("approve")}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
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
                <p style={{ margin: "6px 0 0", fontSize: 16, color: T.grey600, fontFamily: "monospace", fontWeight: 500 }}>
                  송장: {order.tracking_number}
                </p>
              )}
            </StatusHeader>

            {(hasTracking || canApprove) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={actionRowStyle}>
                  <ActionButton
                    variant="neutralOutline"
                    onClick={() => onActionClick(hasTracking ? "tracking_detail" : "tracking_start")}
                  >
                    {hasTracking ? <FileText size={18} style={{ flexShrink: 0 }} /> : <Navigation size={18} style={{ flexShrink: 0 }} />}
                    {hasTracking ? "송장 상세" : "송장 등록"}
                    {hasTracking && <ChevronRight size={18} style={{ flexShrink: 0 }} />}
                  </ActionButton>
                  {hasTracking && canApprove && (
                    <ActionButton variant="neutralOutline" onClick={() => onActionClick("tracking_refresh")}>
                      <RefreshCw size={18} style={{ flexShrink: 0 }} />
                      배송 갱신
                    </ActionButton>
                  )}
                </div>
                {canApprove && (
                  <ActionButton onClick={() => onActionClick("confirm_receipt")} style={{ width: "100%" }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    {isDelivered ? "입고 확인" : "입고 확인"}
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
                수량 <span style={{ fontWeight: 600, color: T.grey700 }}>{order.qty}{item.unit}</span>
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
                수량 <span style={{ fontWeight: 600, color: T.grey700 }}>{order.qty}{item.unit}</span>
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
