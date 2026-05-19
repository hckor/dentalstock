import { useMemo, useState } from "react";
import { Truck, Package, PackageCheck, AlertCircle } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { Card } from "../shared/Card";
import { ShippingOrderCard } from "../shared/ShippingOrderCard";

export function ShippingTrackingScreen({orders, allItems, currentUser, openModal, showToast, startTracking, confirmReceipt}) {
  const [trackingTab, setTrackingTab] = useState("auto_wait");

  const isManager = currentUser.role === "owner" || currentUser.role === "manager";

  const myOrders = useMemo(() => {
    // 관리자/원장은 전체 주문, 위생사는 본인 주문만
    return isManager ? orders : orders.filter(o => o.requested_by === currentUser.name);
  }, [orders, currentUser.name, isManager]);

  // 상태별 그룹핑
  // pending → auto_wait (자동대기: 주문 승인 필요)
  // ordered → in_transit (진행중: 배송 중)
  // received → completed (완료: 배송 도착)
  const groupedOrders = useMemo(() => {
    const groups = {
      auto_wait: myOrders.filter(o => o.status === "pending"),
      in_transit: myOrders.filter(o => o.status === "ordered"),
      completed: myOrders.filter(o => o.status === "received"),
    };
    return groups;
  }, [myOrders]);

  const tabDefs = [
    {id: "auto_wait", label: "자동대기", icon: AlertCircle, count: groupedOrders.auto_wait.length},
    {id: "in_transit", label: "진행중", icon: Truck, count: groupedOrders.in_transit.length},
    {id: "completed", label: "완료", icon: PackageCheck, count: groupedOrders.completed.length},
  ];

  const currentOrders = groupedOrders[trackingTab];

  const handleActionClick = (order, actionType) => {
    if (actionType === "order_link") {
      showToast("도매 사이트에서 직접 주문해주세요");
    } else if (actionType === "tracking_start") {
      // 더미 송장번호로 즉시 배송 추적 시작 (실제는 사용자가 입력)
      const carriers = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배"];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const trackingNumber = String(Math.floor(Math.random() * 9000000000) + 1000000000);
      startTracking(order.id, carrier, trackingNumber);
      setTrackingTab("in_transit");
    } else if (actionType === "tracking_detail") {
      openModal("shipping_detail", order);
    } else if (actionType === "confirm_receipt") {
      confirmReceipt(order.id, order.qty, "");
      setTrackingTab("completed");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      {/* ── 탭 네비게이션 ── */}
      <div style={{ background: T.white, borderRadius: 14, padding: "10px", marginBottom: 16, display: "flex", gap: 6 }}>
        {tabDefs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTrackingTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "none",
              borderRadius: 9999,
              cursor: "pointer",
              fontFamily: font,
              fontSize: 16,
              fontWeight: 600,
              background: trackingTab === tab.id ? T.grey900 : T.grey100,
              color: trackingTab === tab.id ? T.white : T.grey600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              transition: "all 150ms",
            }}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  background: trackingTab === tab.id ? T.red500 : T.red500,
                  color: T.white,
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 6px",
                  marginLeft: 4,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

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
            {trackingTab === "in_transit" && "배송 중인 주문이 없어요"}
            {trackingTab === "completed" && "완료된 주문이 없어요"}
          </p>
          <p style={{ margin: 0, fontSize: 16, color: T.grey500 }}>
            {trackingTab === "auto_wait" && "새로운 주문이 필요하신가요?"}
            {trackingTab === "in_transit" && "곧 도착할 예정입니다"}
            {trackingTab === "completed" && "입고 확인을 완료한 주문들입니다"}
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
                onActionClick={(actionType) => handleActionClick(order, actionType)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
