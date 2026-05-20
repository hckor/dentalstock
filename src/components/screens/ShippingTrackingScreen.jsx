import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, FileText, Navigation, Package, RefreshCw } from "lucide-react";
import { T, font } from "../../constants/colors";
import { Card } from "../shared/Card";
import { ShippingOrderCard } from "../shared/ShippingOrderCard";
import { getShippingEvents } from "../../utils/shippingEvents";
import { getOrderVendorKey, getVendorLabel } from "../../utils/vendorSelection";

const CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배"];

function hashOrderId(orderId) {
  return String(orderId).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function makeDemoTracking(orderId) {
  const hash = hashOrderId(orderId);
  return {
    carrier: CARRIERS[hash % CARRIERS.length],
    trackingNumber: String(1000000000 + (hash * 2654435761) % 9000000000),
  };
}

function groupInTransitOrders(orders) {
  const groups = new Map();
  orders.forEach(order => {
    const key = order.shipment_group_id ||
      (order.review_note === "일괄 승인" && order.reviewed_at ? `bulk:${order.reviewed_at}:${order.reviewed_by || ""}:${getOrderVendorKey(order)}` : order.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(order);
  });
  return Array.from(groups.entries()).map(([id, groupOrders]) => ({ id, orders: groupOrders }));
}

function getReceivedAt(order) {
  return order.received_at ||
    getShippingEvents(order).find(event => event.status === "입고완료")?.timestamp ||
    order.reviewed_at ||
    order.requested_at ||
    "";
}

function getCompletedDateKey(order) {
  const receivedAt = getReceivedAt(order);
  const parsed = new Date(receivedAt);
  if (!receivedAt || Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toISOString().slice(0, 10);
}

function formatCompletedDateLabel(dateKey) {
  if (dateKey === "unknown") return "날짜 미상";
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "날짜 미상";
  return parsed.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function getCompletedDeliveryKey(order) {
  if (order.shipment_group_id) return `shipment:${order.shipment_group_id}`;
  if (order.tracking_number) return `tracking:${order.carrier || ""}:${order.tracking_number}`;
  if (order.review_note === "일괄 승인" && order.reviewed_at) {
    return `bulk:${order.reviewed_at}:${order.reviewed_by || ""}:${getOrderVendorKey(order)}`;
  }
  return `single:${order.id}`;
}

function groupCompletedOrdersByDate(orders) {
  const dateGroups = new Map();
  orders.forEach(order => {
    const dateKey = getCompletedDateKey(order);
    const deliveryKey = getCompletedDeliveryKey(order);
    if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, new Map());
    const deliveries = dateGroups.get(dateKey);
    if (!deliveries.has(deliveryKey)) deliveries.set(deliveryKey, []);
    deliveries.get(deliveryKey).push(order);
  });

  return Array.from(dateGroups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, deliveries]) => ({
      dateKey,
      label: formatCompletedDateLabel(dateKey),
      orderCount: Array.from(deliveries.values()).reduce((sum, groupOrders) => sum + groupOrders.length, 0),
      groups: Array.from(deliveries.entries())
        .map(([id, groupOrders]) => ({
          id,
          orders: groupOrders.sort((a, b) => getReceivedAt(b).localeCompare(getReceivedAt(a))),
          receivedAt: groupOrders.map(getReceivedAt).sort().at(-1) || "",
        }))
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    }));
}

function ShipmentGroupCard({ group, allItems, canApprove, onActionClick }) {
  const firstOrder = group.orders[0];
  const vendorLabel = getVendorLabel(firstOrder);
  const hasTracking = Boolean(firstOrder?.tracking_number);
  const latestShippingEvent = getShippingEvents(firstOrder)[0];
  const isDelivered = latestShippingEvent?.status === "배달완료";
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

function ReceivedGroupCard({ group, allItems }) {
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

export function ShippingTrackingScreen({orders, allItems, currentUser, canApprove, openModal, showToast, approveOrder, approveOrders, rejectOrder, startTracking, refreshTracking, confirmReceipt, onRunPriceMonitor}) {
  const [trackingTab, setTrackingTab] = useState("auto_wait");
  const [deselectedPendingIds, setDeselectedPendingIds] = useState([]);
  const [priceCheckingIds, setPriceCheckingIds] = useState([]);

  const visibleOrders = useMemo(
    () => canApprove ? orders : orders.filter(o => o.requested_by === currentUser.name),
    [canApprove, currentUser.name, orders]
  );

  const groupedOrders = useMemo(() => {
    return {
      auto_wait: visibleOrders.filter(o => o.status === "pending"),
      in_transit: visibleOrders.filter(o => o.status === "ordered"),
      completed: visibleOrders.filter(o => o.status === "received"),
      rejected: visibleOrders.filter(o => o.status === "rejected"),
    };
  }, [visibleOrders]);

  const tabDefs = [
    {id: "auto_wait", label: "승인대기", count: groupedOrders.auto_wait.length},
    {id: "in_transit", label: "진행중", count: groupedOrders.in_transit.length},
    {id: "completed", label: "완료", count: groupedOrders.completed.length},
    {id: "rejected", label: "반려", count: groupedOrders.rejected.length},
  ];
  const primaryTabDefs = tabDefs.filter(tab => tab.id !== "rejected");
  const rejectedTab = tabDefs.find(tab => tab.id === "rejected");

  const currentOrders = groupedOrders[trackingTab];
  const currentShipmentGroups = useMemo(
    () => trackingTab === "in_transit" ? groupInTransitOrders(currentOrders) : [],
    [currentOrders, trackingTab]
  );
  const completedDateGroups = useMemo(
    () => trackingTab === "completed" ? groupCompletedOrdersByDate(currentOrders) : [],
    [currentOrders, trackingTab]
  );
  const pendingIds = useMemo(() => groupedOrders.auto_wait.map(order => order.id), [groupedOrders.auto_wait]);
  const selectedPendingIds = useMemo(
    () => pendingIds.filter(id => !deselectedPendingIds.includes(id)),
    [deselectedPendingIds, pendingIds]
  );
  const selectedPendingCount = selectedPendingIds.length;

  const togglePendingSelection = (orderId) => {
    setDeselectedPendingIds(prev => prev.includes(orderId)
      ? prev.filter(id => id !== orderId)
      : [...prev, orderId]
    );
  };

  const toggleAllPending = () => {
    setDeselectedPendingIds(selectedPendingCount === pendingIds.length ? pendingIds : []);
  };

  const handleBulkApprove = () => {
    if (!canApprove) {
      showToast("승인 권한이 없습니다");
      return;
    }
    if (!selectedPendingCount) {
      showToast("승인할 발주 요청을 선택해 주세요");
      return;
    }
    approveOrders(selectedPendingIds, "일괄 승인");
    setDeselectedPendingIds([]);
    setTrackingTab("in_transit");
  };

  const handlePriceCheck = async (order) => {
    if (!canApprove) {
      showToast("가격 확인 권한이 없습니다");
      return;
    }
    const item = allItems.find(target => target.id === order.item_id);
    if (!item) {
      showToast("품목 정보를 찾지 못했습니다");
      return;
    }
    const hasVendorUrl = Array.isArray(item.vendor_options) && item.vendor_options.some(option => option.url);
    if (!hasVendorUrl) {
      showToast("품목 편집에서 구매 후보 URL을 먼저 등록해 주세요");
      return;
    }
    if (!onRunPriceMonitor) {
      showToast("가격 확인 기능이 아직 연결되지 않았습니다");
      return;
    }

    setPriceCheckingIds(prev => prev.includes(order.id) ? prev : [...prev, order.id]);
    try {
      await onRunPriceMonitor(item);
    } finally {
      setPriceCheckingIds(prev => prev.filter(id => id !== order.id));
    }
  };

  const handleActionClick = (order, actionType) => {
    if (actionType === "approve") {
      if (!canApprove) {
        showToast("승인 권한이 없습니다");
        return;
      }
      approveOrder(order.id, "");
      setTrackingTab("in_transit");
    } else if (actionType === "reject") {
      if (!canApprove) {
        showToast("거절 권한이 없습니다");
        return;
      }
      rejectOrder(order.id, "관리자 반려");
      setTrackingTab("rejected");
    } else if (actionType === "tracking_start") {
      if (!canApprove) {
        showToast("송장 등록 권한이 없습니다");
        return;
      }
      const { carrier, trackingNumber } = makeDemoTracking(order.id);
      startTracking(order.id, carrier, trackingNumber);
      setTrackingTab("in_transit");
    } else if (actionType === "tracking_detail") {
      openModal("shipping_detail", order);
    } else if (actionType === "tracking_refresh") {
      refreshTracking(order.id);
      setTrackingTab("in_transit");
    } else if (actionType === "confirm_receipt") {
      if (!canApprove) {
        showToast("입고 확인 권한이 없습니다");
        return;
      }
      confirmReceipt(order.id, order.qty, "");
      setTrackingTab("completed");
    }
  };

  const handleShipmentGroupActionClick = (group, actionType) => {
    const firstOrder = group.orders[0];
    if (!firstOrder) return;
    if (actionType === "tracking_start") {
      if (!canApprove) {
        showToast("송장 등록 권한이 없습니다");
        return;
      }
      const { carrier, trackingNumber } = makeDemoTracking(group.id);
      startTracking(firstOrder.id, carrier, trackingNumber);
      setTrackingTab("in_transit");
    } else if (actionType === "tracking_refresh") {
      refreshTracking(firstOrder.id);
      setTrackingTab("in_transit");
    } else if (actionType === "tracking_detail") {
      openModal("shipping_detail", firstOrder);
    } else if (actionType === "confirm_receipt") {
      if (!canApprove) {
        showToast("입고 확인 권한이 없습니다");
        return;
      }
      openModal("confirm_bulk_receipt", group);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── 탭 네비게이션 ── */}
      <div style={{ background: T.grey100, borderRadius: 12, padding: 4, marginBottom: 8, display: "flex", gap: 2 }}>
        {primaryTabDefs.map(tab => {
          const active = trackingTab === tab.id;
          return (
          <button
            key={tab.id}
            onClick={() => setTrackingTab(tab.id)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 8px",
              border: "none",
              borderRadius: 9999,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: "20px",
              background: active ? T.white : "transparent",
              boxShadow: active ? "0px 2px 4px rgba(0,0,0,0.06)" : "none",
              color: active ? T.grey900 : T.grey500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              whiteSpace: "nowrap",
              wordBreak: "keep-all",
              transition: "all 150ms",
            }}
          >
            {tab.label}
            <span style={{minWidth:20,padding:"1px 6px",borderRadius:9999,boxSizing:"border-box",background:active?T.blue50:T.white,color:tab.count>0?(active?T.blue500:T.grey700):T.grey400,fontSize:12,fontWeight:700,lineHeight:"18px"}}>
              {tab.count}
            </span>
          </button>
          );
        })}
      </div>

      {rejectedTab && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",marginBottom:16}}>
          <button
            onClick={() => setTrackingTab(rejectedTab.id)}
            style={{gridColumn:"1",minWidth:0,padding:"7px 8px",borderRadius:9999,border:`1px solid ${trackingTab===rejectedTab.id?`${T.red500}33`:T.grey200}`,background:trackingTab===rejectedTab.id?T.red50:T.white,color:trackingTab===rejectedTab.id?T.red500:T.grey500,fontFamily:font,fontSize:13,fontWeight:700,lineHeight:"18px",cursor:"pointer",whiteSpace:"nowrap",wordBreak:"keep-all"}}
          >
            {rejectedTab.label} {rejectedTab.count}건
          </button>
        </div>
      )}

      {trackingTab === "auto_wait" && canApprove && currentOrders.length > 0 && (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={toggleAllPending}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9999,
                border: `1px solid ${selectedPendingCount ? T.blue500 : T.grey300}`,
                background: selectedPendingCount ? T.blue500 : T.white,
                color: T.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {selectedPendingCount > 0 && <CheckCircle2 size={20} color={T.white} strokeWidth={3} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.grey900 }}>일괄 승인</p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: T.grey500 }}>
                {selectedPendingCount}건 선택됨 · 승인 후 진행중으로 이동합니다
              </p>
            </div>
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={!selectedPendingCount}
              style={{
                minHeight: 42,
                padding: "10px 15px",
                borderRadius: 9999,
                border: "none",
                background: selectedPendingCount ? T.blue500 : T.grey200,
                color: selectedPendingCount ? T.white : T.grey500,
                fontFamily: font,
                fontSize: 14,
                fontWeight: 700,
                cursor: selectedPendingCount ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              {selectedPendingCount}건 승인
            </button>
          </div>
        </Card>
      )}

      {/* ── 주문 목록 ── */}
      {currentOrders.length === 0 ? (
        <Card style={{ padding: "40px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 9999,
              background: T.grey100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Package size={28} color={T.grey400} />
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: T.grey700 }}>
            {trackingTab === "auto_wait" && "승인 대기 중인 주문이 없어요"}
            {trackingTab === "in_transit" && "진행 중인 주문이 없어요"}
            {trackingTab === "completed" && "입고 완료된 주문이 없어요"}
            {trackingTab === "rejected" && "반려된 주문이 없어요"}
          </p>
          <p style={{ margin: 0, fontSize: 16, color: T.grey500 }}>
            {trackingTab === "auto_wait" && (canApprove ? "요청을 승인하거나 반려할 수 있습니다" : "관리자 검토를 기다리는 요청입니다")}
            {trackingTab === "in_transit" && "송장 등록과 입고 확인을 진행하세요"}
            {trackingTab === "completed" && "입고 확인을 완료한 주문들입니다"}
            {trackingTab === "rejected" && "반려된 발주 요청입니다"}
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {trackingTab === "completed" ? completedDateGroups.map(dateGroup => (
            <div key={dateGroup.dateKey} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px 2px" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.grey700 }}>{dateGroup.label}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.grey500 }}>{dateGroup.orderCount}건</span>
              </div>
              {dateGroup.groups.map(group => (
                <ReceivedGroupCard key={group.id} group={group} allItems={allItems} />
              ))}
            </div>
          )) : trackingTab === "in_transit" ? currentShipmentGroups.map(group => {
            if (group.orders.length > 1) {
              return (
                <ShipmentGroupCard
                  key={group.id}
                  group={group}
                  allItems={allItems}
                  canApprove={canApprove}
                  onActionClick={(actionType) => handleShipmentGroupActionClick(group, actionType)}
                />
              );
            }
            const order = group.orders[0];
            const item = allItems.find(it => it.id === order.item_id);
            return (
              <ShippingOrderCard
                key={order.id}
                order={order}
                item={item}
                stage={trackingTab}
                canApprove={canApprove}
                onActionClick={(actionType) => handleActionClick(order, actionType)}
                selectable={trackingTab === "auto_wait" && canApprove}
                selected={selectedPendingIds.includes(order.id)}
                onSelectChange={() => togglePendingSelection(order.id)}
                priceChecking={priceCheckingIds.includes(order.id)}
                onPriceCheck={() => handlePriceCheck(order)}
              />
            );
          }) : currentOrders.map(order => {
            const item = allItems.find(it => it.id === order.item_id);
            return (
              <ShippingOrderCard
                key={order.id}
                order={order}
                item={item}
                stage={trackingTab}
                canApprove={canApprove}
                onActionClick={(actionType) => handleActionClick(order, actionType)}
                selectable={trackingTab === "auto_wait" && canApprove}
                selected={selectedPendingIds.includes(order.id)}
                onSelectChange={() => togglePendingSelection(order.id)}
                priceChecking={priceCheckingIds.includes(order.id)}
                onPriceCheck={() => handlePriceCheck(order)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
