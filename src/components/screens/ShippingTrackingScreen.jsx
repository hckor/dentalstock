import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { T, font } from "../../constants/colors";
import { Card } from "../shared/Card";
import { ShippingOrderCard } from "../shared/ShippingOrderCard";

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

export function ShippingTrackingScreen({orders, allItems, currentUser, canApprove, openModal, showToast, approveOrder, rejectOrder, startTracking, confirmReceipt}) {
  const [trackingTab, setTrackingTab] = useState("auto_wait");

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

  const currentOrders = groupedOrders[trackingTab];
  const currentTabMeta = tabDefs.find(tab => tab.id === trackingTab) || tabDefs[0];

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
    } else if (actionType === "confirm_receipt") {
      if (!canApprove) {
        showToast("입고 확인 권한이 없습니다");
        return;
      }
      confirmReceipt(order.id, order.qty, "");
      setTrackingTab("completed");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── 탭 네비게이션 ── */}
      <div style={{ background: T.grey100, borderRadius: 12, padding: 4, marginBottom: 8, display: "flex", gap: 2 }}>
        {tabDefs.map(tab => (
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
              background: trackingTab === tab.id ? T.white : "transparent",
              boxShadow: trackingTab === tab.id ? "0px 2px 4px rgba(0,0,0,0.06)" : "none",
              color: trackingTab === tab.id ? T.grey900 : T.grey500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              whiteSpace: "nowrap",
              wordBreak: "keep-all",
              transition: "all 150ms",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p style={{margin:"0 2px 16px",fontSize:13,fontWeight:500,lineHeight:"20px",color:T.grey500}}>
        <span style={{fontWeight:700,color:T.grey700}}>{currentTabMeta.label}</span> {currentTabMeta.count}건
      </p>

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
          {currentOrders.map(order => {
            const item = allItems.find(it => it.id === order.item_id);
            return (
              <ShippingOrderCard
                key={order.id}
                order={order}
                item={item}
                stage={trackingTab}
                canApprove={canApprove}
                onActionClick={(actionType) => handleActionClick(order, actionType)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
