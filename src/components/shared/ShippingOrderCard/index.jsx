import { memo } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, Navigation, RefreshCw, XCircle } from "lucide-react";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { can } from "../../../constants/permissions";
import { getOrderActionAvailability } from "../../../utils/orderApproval";
import { getShippingEvents } from "../../../utils/shippingEvents";
import { getVendorLabel } from "../../../utils/vendorSelection";
import { Card } from "../Card";
import {
  actionRowStyle,
  bodyStyle,
  contentStyle,
  emphasisStyle,
  holdStatusMeta,
  iconStyle,
  metaStyle,
  noticeStyle,
  stackedActionStyle,
  trackingNumberStyle,
} from "./shippingOrderCard.styles";
import { getShippingDelaySignal } from "./shippingOrderCard.utils";
import {
  ActionButton,
  ApprovalActionNotices,
  ApprovalDecisionPanel,
  PriceCandidatePanel,
  ReviewNotice,
  SelectToggle,
  StatusHeader,
} from "./shippingOrderCard.parts";

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick, selectable = false, selected = false, onSelectChange, priceChecking = false, onPriceCheck, duplicateInfo = null, monthlyProjectedAmount = 0, currentUser = null, actionAvailability = null }) {
  const os = ORDER_ST[order.status] || holdStatusMeta;
  const vendorLabel = getVendorLabel(order);

  if (!item) return null;
  const resolvedActionAvailability = actionAvailability || getOrderActionAvailability({ order, item, currentUser, duplicateInfo, monthlyProjectedAmount });
  const canViewPriceData = can(currentUser?.role, "cost_view") || can(currentUser?.role, "orders_price_check");

  const renderStageContent = () => {
    switch (stage) {
      case "hold":
      case "auto_wait": {
        const canApproveAction = canApprove && resolvedActionAvailability.approve.allowed;
        const canHold = canApprove && resolvedActionAvailability.hold.allowed;
        const canReject = canApprove && resolvedActionAvailability.reject.allowed;
        const approvalBlocked = resolvedActionAvailability.approve.requiresOwnerApproval && !resolvedActionAvailability.approve.allowed;
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

            {canViewPriceData && (
              <PriceCandidatePanel
                item={item}
                order={order}
                canApprove={canApprove}
                checking={priceChecking}
                onPriceCheck={onPriceCheck}
              />
            )}

            {canViewPriceData && (
              <ApprovalDecisionPanel order={order} item={item} duplicateInfo={duplicateInfo} monthlyProjectedAmount={monthlyProjectedAmount} />
            )}

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
                  <ActionButton onClick={() => onActionClick("approve")} disabled={!canApproveAction}>
                    <CheckCircle2 size={18} style={iconStyle} />
                    {approvalBlocked ? "원장 필요" : canApproveAction ? "승인" : "권한 없음"}
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
                <span style={{ fontWeight: 600, color: isDelivered ? ORDER_ST.received.text : ORDER_ST.ordered.text }}>
                  {hasTracking ? (isDelivered ? "배달완료" : latestShippingEvent?.status || "배송 추적 중") : "송장 미등록"}
                </span>
                {order.carrier && ` · ${order.carrier}`}
              </p>
              <p style={metaStyle}>거래처: {vendorLabel}</p>
              {Number(order.received_qty) > 0 && (
                <p style={metaStyle}>
                  부분입고 <span style={{ fontWeight: 700, color: T.warning }}>{order.received_qty}/{order.qty}{item.unit}</span>
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
                  <span style={{ fontWeight: 600, color: ORDER_ST.received.text }}>✓ 입고 완료</span>
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
