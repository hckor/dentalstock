import { memo } from "react";
import { CheckCircle2, ChevronRight, FileText, Navigation, XCircle } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { Card } from "./Card";
import { Chip } from "./Chip";

const bodyStyle = { padding: "18px 20px" };
const headerStyle = { display: "flex", alignItems: "flex-start", gap: 12 };
const titleStyle = { margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 };
const metaStyle = { margin: "4px 0 0", fontSize: 16, color: T.grey500 };
const actionRowStyle = { display: "flex", gap: 8 };
const noticeStyle = { padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 };
const actionButtonBase = {
  flex: 1,
  padding: "12px 16px",
  borderRadius: 9999,
  cursor: "pointer",
  fontFamily: font,
  fontSize: 16,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
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

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick }) {
  const os = ORDER_ST[order.status];

  if (!item) return null;

  const renderStageContent = () => {
    switch (stage) {
      case "auto_wait": {
        return (
          <div style={bodyStyle}>
            <StatusHeader item={item} statusMeta={os}>
              <p style={metaStyle}>
                <span style={{ fontWeight: 600, color: T.grey700 }}>수량:</span> {order.qty}{item.unit}
                {order.requested_by && ` · 요청자: ${order.requested_by}`}
              </p>
              {order.note && <p style={metaStyle}>메모: {order.note}</p>}
            </StatusHeader>

            {canApprove ? (
              <div style={actionRowStyle}>
                <ActionButton variant="dangerOutline" onClick={() => onActionClick("reject")}>
                  <XCircle size={18} />
                  반려
                </ActionButton>
                <ActionButton onClick={() => onActionClick("approve")}>
                  <CheckCircle2 size={18} />
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
        return (
          <div style={bodyStyle}>
            <StatusHeader item={item} statusMeta={os}>
              <p style={metaStyle}>
                <span style={{ fontWeight: 600, color: T.teal500 }}>{hasTracking ? "배송 추적 중" : "송장 미등록"}</span>
                {order.carrier && ` · ${order.carrier}`}
              </p>
              {order.tracking_number && (
                <p style={{ margin: "6px 0 0", fontSize: 16, color: T.grey600, fontFamily: "monospace", fontWeight: 500 }}>
                  송장: {order.tracking_number}
                </p>
              )}
            </StatusHeader>

            {(hasTracking || canApprove) && (
              <div style={actionRowStyle}>
                <ActionButton
                  variant="neutralOutline"
                  onClick={() => onActionClick(hasTracking ? "tracking_detail" : "tracking_start")}
                >
                  {hasTracking ? <FileText size={18} /> : <Navigation size={18} />}
                  {hasTracking ? "송장 상세" : "송장 등록"}
                  {hasTracking && <ChevronRight size={18} style={{ marginLeft: "auto" }} />}
                </ActionButton>
                {canApprove && (
                  <ActionButton onClick={() => onActionClick("confirm_receipt")}>
                    <CheckCircle2 size={18} />
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
