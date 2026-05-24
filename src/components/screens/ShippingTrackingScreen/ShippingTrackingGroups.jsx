import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Coins, FileText, Navigation, Package, RefreshCw, TrendingDown } from "lucide-react";
import { Card } from "../../shared/Card";
import { T, font, monoFont } from "../../../constants/colors";
import { compactMoney as formatCompactCurrency } from "../../../utils/money";
import {
  getDuplicatePendingCount,
  getPendingSummary,
} from "../../../utils/orderReview";
import { getShippingEvents } from "../../../utils/shippingEvents";
import { getVendorLabel } from "../../../utils/vendorSelection";

const shippingDelayReferenceTime = Date.now();
const dayMs = 86400000;

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
      severity: 3,
      title: "배송완료 후 입고 미확인",
      body: `도착 후 ${deliveredDays}일 지났습니다 · 입고 수량 확인 필요`,
      color: T.red500,
      bg: T.red50,
    };
  }
  if (!order.tracking_number && orderedDays !== null && orderedDays >= 3) {
    return {
      severity: 2,
      title: "송장 등록 지연",
      body: `승인 후 ${orderedDays}일째 송장이 없습니다 · 거래처/송장 확인 필요`,
      color: T.orange500,
      bg: T.orange50,
    };
  }
  if (orderedDays !== null && orderedDays >= 5) {
    return {
      severity: 1,
      title: "입고 지연 가능성",
      body: `발주 후 ${orderedDays}일째 입고 전입니다 · 배송 상태 확인 필요`,
      color: T.orange500,
      bg: T.orange50,
    };
  }
  return null;
}

export function PendingDecisionSummary({ orders, allItems, duplicateInfoByOrderId }) {
  const summary = getPendingSummary(orders, allItems);
  const duplicateCount = getDuplicatePendingCount(orders, duplicateInfoByOrderId);
  const cards = [
    { label: "승인 대기 총액", value: formatCompactCurrency(summary.amount), sub: `${orders.length}건 검토`, Icon: Coins, color: T.grey900, bg: T.white },
    { label: "재고 위험", value: `${summary.stockRisk}건`, sub: "최소수량 미만", Icon: AlertTriangle, color: summary.stockRisk ? T.red500 : T.green500, bg: summary.stockRisk ? T.red50 : T.green50 },
    { label: "중복 검토", value: `${duplicateCount}건`, sub: "진행중/대기 중복", Icon: AlertTriangle, color: duplicateCount ? T.orange500 : T.green500, bg: duplicateCount ? T.orange50 : T.green50 },
    { label: "절감 가능", value: formatCompactCurrency(summary.savings), sub: "후보가 기준", Icon: TrendingDown, color: T.green500, bg: T.green50 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 8, marginBottom: 12 }}>
      {cards.map(card => {
        const Icon = card.Icon;
        return (
          <Card key={card.label} style={{ padding: "12px 10px", background: card.bg }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.label}</p>
              <Icon size={15} color={card.color} style={{ flexShrink: 0 }} />
            </div>
            <p style={{ margin: 0, fontSize: 20, lineHeight: "25px", fontWeight: 800, color: card.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.value}</p>
            <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: "15px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.sub}</p>
          </Card>
        );
      })}
    </div>
  );
}

export function ShipmentGroupCard({ group, allItems, canApprove, onActionClick }) {
  const firstOrder = group.orders[0];
  const vendorLabel = getVendorLabel(firstOrder);
  const hasTracking = Boolean(firstOrder?.tracking_number);
  const latestShippingEvent = getShippingEvents(firstOrder)[0];
  const isDelivered = latestShippingEvent?.status === "배달완료";
  const delaySignal = group.orders
    .map(getShippingDelaySignal)
    .filter(Boolean)
    .sort((a, b) => b.severity - a.severity)[0];
  const itemLines = group.orders
    .map(order => {
      const item = allItems.find(it => it.id === order.item_id);
      if (!item) return null;
      return `${item.name} ${order.qty}${item.unit}`;
    })
    .filter(Boolean);

  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9999, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>묶음 배송 {group.orders.length}건</p>
            <p style={{ margin: "5px 0 0", fontSize: 15, color: T.grey500, lineHeight: 1.45, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
              {vendorLabel} · {itemLines.join(" · ")}
            </p>
          </div>
          <span style={{ flexShrink: 0, borderRadius: 9999, padding: "5px 9px", background: hasTracking ? T.teal50 : T.grey100, color: hasTracking ? T.teal500 : T.grey600, fontSize: 12, fontWeight: 700 }}>
            {hasTracking ? "송장등록" : "송장대기"}
          </span>
        </div>

        <div style={{ borderRadius: 12, background: T.grey50, padding: "12px 14px", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isDelivered ? T.green500 : T.grey800 }}>
            {hasTracking ? (isDelivered ? "배달완료" : latestShippingEvent?.status || "배송 추적 중") : "같이 발주된 품목은 하나의 송장으로 관리합니다"}
          </p>
          {hasTracking && (
            <p style={{ margin: "5px 0 0", fontSize: 14, color: T.grey600, fontFamily: "monospace", fontWeight: 500 }}>
              {firstOrder.carrier} · {firstOrder.tracking_number}
            </p>
          )}
        </div>

        {delaySignal && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, borderRadius: 12, background: delaySignal.bg, color: delaySignal.color, padding: "10px 12px", marginBottom: 12 }}>
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: delaySignal.color }}>{delaySignal.title}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.4, color: T.grey700, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{delaySignal.body}</p>
            </div>
          </div>
        )}

        {canApprove && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
              <button
                type="button"
                onClick={() => onActionClick(hasTracking ? "tracking_refresh" : "tracking_start")}
                style={{ flex: 1, minHeight: 44, borderRadius: 9999, border: hasTracking ? `1.5px solid ${T.grey300}` : "none", background: hasTracking ? T.white : T.blue500, color: hasTracking ? T.grey700 : T.white, fontFamily: font, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {hasTracking ? <RefreshCw size={18} /> : <Navigation size={18} />}
                {hasTracking ? "배송 갱신" : "묶음 송장 등록"}
              </button>
              {hasTracking && (
                <button
                  type="button"
                  onClick={() => onActionClick("tracking_detail")}
                  style={{ flex: 1, minHeight: 44, borderRadius: 9999, border: `1.5px solid ${T.grey300}`, background: T.white, color: T.grey700, fontFamily: font, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <FileText size={18} />
                  송장 보기
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onActionClick("confirm_receipt")}
              style={{ width: "100%", minHeight: 46, borderRadius: 9999, border: "none", background: T.blue500, color: T.white, fontFamily: font, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <CheckCircle2 size={18} />
              묶음 입고 수량 확인
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ReceivedGroupCard({ group, allItems }) {
  const [expanded, setExpanded] = useState(false);
  const firstOrder = group.orders[0];
  const vendorLabel = getVendorLabel(firstOrder);
  const hasTracking = Boolean(firstOrder?.tracking_number);
  const itemRows = group.orders
    .map(order => {
      const item = allItems.find(target => target.id === order.item_id);
      if (!item) return null;
      return {
        id: order.id,
        name: item.name,
        qty: Number(order.received_qty) || order.qty,
        unit: item.unit,
      };
    })
    .filter(Boolean);
  const previewItems = itemRows.slice(0, 3);
  const hiddenCount = Math.max(0, itemRows.length - previewItems.length);
  const receivedTime = group.receivedAt
    ? new Date(group.receivedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "시간 미상";

  return (
    <Card style={{ overflow: "hidden", padding: 0 }}>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        style={{ width: "100%", border: "none", background: T.white, padding: "16px 18px", cursor: "pointer", fontFamily: font, textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9999, background: T.green50, color: T.green500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                {group.orders.length > 1 ? `묶음 입고 ${group.orders.length}건` : itemRows[0]?.name || "입고 완료"}
              </p>
              <span style={{ borderRadius: 9999, padding: "3px 8px", background: T.green50, color: T.green500, fontSize: 12, fontWeight: 700 }}>
                완료
              </span>
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 14, color: T.grey500, lineHeight: 1.45, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
              {vendorLabel} · {receivedTime}
              {hasTracking && ` · ${firstOrder.carrier || "배송사"} ${firstOrder.tracking_number}`}
            </p>
            <p style={{ margin: "7px 0 0", fontSize: 14, color: T.grey700, lineHeight: 1.45, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
              {previewItems.map(item => `${item.name} ${item.qty}${item.unit}`).join(" · ")}
              {hiddenCount > 0 && ` · 외 ${hiddenCount}건`}
            </p>
          </div>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, color: T.grey500 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{itemRows.length}품목</span>
            <ChevronRight size={18} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.grey100}`, padding: "8px 18px 14px" }}>
          {itemRows.map((item, index) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: index === 0 ? "none" : `1px solid ${T.grey100}` }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: T.green500, flexShrink: 0 }} />
              <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 15, fontWeight: 600, color: T.grey800, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                {item.name}
              </p>
              <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: T.grey700 }}>
                {item.qty}{item.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
