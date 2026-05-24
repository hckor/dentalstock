import { useMemo, useState } from "react";
import { CheckCircle2, Package } from "lucide-react";
import { T, font } from "../../constants/colors";
import { can } from "../../constants/permissions";
import { Card } from "../shared/Card";
import { ShippingOrderCard } from "../shared/ShippingOrderCard";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";
import {
  getMonthlyProjectedAmounts,
  getOrderApprovalGate,
  getOrderDuplicateInfo,
} from "../../utils/orderReview";
import {
  PendingDecisionSummary,
  ReceivedGroupCard,
  ShipmentGroupCard,
} from "./ShippingTrackingScreen/ShippingTrackingGroups";
import {
  groupCompletedOrdersByDate,
  groupInTransitOrders,
  makeDemoTracking,
} from "./ShippingTrackingScreen/shippingTrackingUtils";

export function ShippingTrackingScreen({currentUser, canApprove, initialTab = "auto_wait", openModal, showToast, onRunPriceMonitor}) {
  const { items: allItems } = useInventory();
  const { orders, approveOrder, approveOrders, rejectOrder, startTracking, refreshTracking, confirmReceipt } = useOrders();
  const [trackingTab, setTrackingTab] = useState(initialTab);
  const [deselectedPendingIds, setDeselectedPendingIds] = useState([]);
  const [priceCheckingIds, setPriceCheckingIds] = useState([]);

  const visibleOrders = useMemo(
    () => canApprove ? orders : orders.filter(o => o.requested_by === currentUser.name),
    [canApprove, currentUser.name, orders]
  );

  const groupedOrders = useMemo(() => {
    return {
      auto_wait: visibleOrders.filter(o => o.status === "pending"),
      hold: visibleOrders.filter(o => o.status === "hold"),
      in_transit: visibleOrders.filter(o => o.status === "ordered"),
      completed: visibleOrders.filter(o => o.status === "received"),
      rejected: visibleOrders.filter(o => o.status === "rejected"),
    };
  }, [visibleOrders]);

  const tabDefs = [
    {id: "auto_wait", label: "승인대기", count: groupedOrders.auto_wait.length},
    {id: "in_transit", label: "진행중", count: groupedOrders.in_transit.length},
    {id: "completed", label: "완료", count: groupedOrders.completed.length},
    {id: "hold", label: "보류", count: groupedOrders.hold.length},
    {id: "rejected", label: "반려", count: groupedOrders.rejected.length},
  ];
  const primaryTabDefs = tabDefs.filter(tab => !["hold", "rejected"].includes(tab.id));
  const holdTab = tabDefs.find(tab => tab.id === "hold");
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
  const duplicateInfoByOrderId = useMemo(() => {
    return Object.fromEntries(orders.map(order => [order.id, getOrderDuplicateInfo(order, orders)]));
  }, [orders]);
  const monthlyProjectedAmountByOrderId = useMemo(
    () => getMonthlyProjectedAmounts(visibleOrders, allItems),
    [allItems, visibleOrders]
  );
  const approvalGateByOrderId = useMemo(() => {
    return Object.fromEntries(visibleOrders.map(order => {
      const item = allItems.find(target => target.id === order.item_id);
      const gate = item
        ? getOrderApprovalGate(order, item, duplicateInfoByOrderId[order.id], monthlyProjectedAmountByOrderId[order.id])
        : { requiresOwnerApproval: false, reasons: [] };
      return [order.id, gate];
    }));
  }, [allItems, duplicateInfoByOrderId, monthlyProjectedAmountByOrderId, visibleOrders]);
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
    const ownerReviewCount = selectedPendingIds.filter(id => approvalGateByOrderId[id]?.requiresOwnerApproval).length;
    if (!can(currentUser.role, "orders_approve_owner_review") && ownerReviewCount > 0) {
      showToast(`${ownerReviewCount}건은 원장 승인 필요입니다. 보류로 넘겨주세요`);
      return;
    }
    approveOrders(selectedPendingIds, "일괄 승인");
    setDeselectedPendingIds([]);
    setTrackingTab("in_transit");
  };

  const handlePriceCheck = async (order) => {
    if (!can(currentUser.role, "orders_price_check")) {
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
      if (!can(currentUser.role, "orders_approve_standard")) {
        showToast("승인 권한이 없습니다");
        return;
      }
      if (!can(currentUser.role, "orders_approve_owner_review") && approvalGateByOrderId[order.id]?.requiresOwnerApproval) {
        showToast("원장 승인 필요 건입니다. 보류로 넘겨주세요");
        return;
      }
      approveOrder(order.id, "");
      setTrackingTab("in_transit");
    } else if (actionType === "hold") {
      if (!can(currentUser.role, "orders_hold")) {
        showToast("보류 권한이 없습니다");
        return;
      }
      const reasons = approvalGateByOrderId[order.id]?.reasons || [];
      rejectOrder(order.id, reasons.length ? `보류: ${reasons.join(" · ")}` : "보류: 추가 확인 필요", "hold");
      setTrackingTab("hold");
    } else if (actionType === "reject") {
      if (!can(currentUser.role, "orders_reject")) {
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
              boxShadow: active ? T.shadowSelected : "none",
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

      {(holdTab || rejectedTab) && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:8,marginBottom:16}}>
          {holdTab && (
            <button
              onClick={() => setTrackingTab(holdTab.id)}
              style={{minWidth:0,padding:"7px 8px",borderRadius:9999,border:`1px solid ${trackingTab===holdTab.id?`${T.purple500}33`:T.grey200}`,background:trackingTab===holdTab.id?T.purple50:T.white,color:trackingTab===holdTab.id?T.purple500:T.grey500,fontFamily:font,fontSize:13,fontWeight:700,lineHeight:"18px",cursor:"pointer",whiteSpace:"nowrap",wordBreak:"keep-all"}}
            >
              {holdTab.label} {holdTab.count}건
            </button>
          )}
          {rejectedTab && (
          <button
            onClick={() => setTrackingTab(rejectedTab.id)}
            style={{minWidth:0,padding:"7px 8px",borderRadius:9999,border:`1px solid ${trackingTab===rejectedTab.id?`${T.red500}33`:T.grey200}`,background:trackingTab===rejectedTab.id?T.red50:T.white,color:trackingTab===rejectedTab.id?T.red500:T.grey500,fontFamily:font,fontSize:13,fontWeight:700,lineHeight:"18px",cursor:"pointer",whiteSpace:"nowrap",wordBreak:"keep-all"}}
          >
            {rejectedTab.label} {rejectedTab.count}건
          </button>
          )}
        </div>
      )}

      {trackingTab === "auto_wait" && canApprove && currentOrders.length > 0 && (
        <PendingDecisionSummary orders={currentOrders} allItems={allItems} duplicateInfoByOrderId={duplicateInfoByOrderId} />
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
            {trackingTab === "hold" && "보류 중인 주문이 없어요"}
            {trackingTab === "rejected" && "반려된 주문이 없어요"}
          </p>
          <p style={{ margin: 0, fontSize: 16, color: T.grey500 }}>
            {trackingTab === "auto_wait" && (canApprove ? "요청을 승인하거나 반려할 수 있습니다" : "관리자 검토를 기다리는 요청입니다")}
            {trackingTab === "in_transit" && "송장 등록과 입고 확인을 진행하세요"}
            {trackingTab === "completed" && "입고 확인을 완료한 주문들입니다"}
            {trackingTab === "hold" && "원장 확인이나 가격 확인이 필요한 요청입니다"}
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
                duplicateInfo={duplicateInfoByOrderId[order.id]}
                monthlyProjectedAmount={monthlyProjectedAmountByOrderId[order.id]}
                currentUser={currentUser}
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
                duplicateInfo={duplicateInfoByOrderId[order.id]}
                monthlyProjectedAmount={monthlyProjectedAmountByOrderId[order.id]}
                currentUser={currentUser}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
