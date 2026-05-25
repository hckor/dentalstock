import { useMemo, useState } from "react";
import { can } from "../../constants/permissions";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";
import {
  getMonthlyProjectedAmounts,
  getOrderApprovalGate,
  getOrderDuplicateInfo,
} from "../../utils/orderReview";
import { BulkApprovalCard } from "./ShippingTrackingScreen/BulkApprovalCard";
import { PendingDecisionSummary } from "./ShippingTrackingScreen/ShippingTrackingGroups";
import { ShippingTrackingEmptyState } from "./ShippingTrackingScreen/ShippingTrackingEmptyState";
import { ShippingTrackingOrderList } from "./ShippingTrackingScreen/ShippingTrackingOrderList";
import { ShippingTrackingTabs } from "./ShippingTrackingScreen/ShippingTrackingTabs";
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
      <ShippingTrackingTabs
        primaryTabs={primaryTabDefs}
        holdTab={holdTab}
        rejectedTab={rejectedTab}
        activeTab={trackingTab}
        onChange={setTrackingTab}
      />

      {trackingTab === "auto_wait" && canApprove && currentOrders.length > 0 && (
        <PendingDecisionSummary orders={currentOrders} allItems={allItems} duplicateInfoByOrderId={duplicateInfoByOrderId} />
      )}

      {trackingTab === "auto_wait" && canApprove && currentOrders.length > 0 && (
        <BulkApprovalCard
          selectedCount={selectedPendingCount}
          totalCount={pendingIds.length}
          onToggleAll={toggleAllPending}
          onApprove={handleBulkApprove}
        />
      )}

      {/* ── 주문 목록 ── */}
      {currentOrders.length === 0 ? (
        <ShippingTrackingEmptyState trackingTab={trackingTab} canApprove={canApprove} />
      ) : (
        <ShippingTrackingOrderList
          trackingTab={trackingTab}
          currentOrders={currentOrders}
          completedDateGroups={completedDateGroups}
          currentShipmentGroups={currentShipmentGroups}
          allItems={allItems}
          canApprove={canApprove}
          selectedPendingIds={selectedPendingIds}
          priceCheckingIds={priceCheckingIds}
          duplicateInfoByOrderId={duplicateInfoByOrderId}
          monthlyProjectedAmountByOrderId={monthlyProjectedAmountByOrderId}
          currentUser={currentUser}
          onActionClick={handleActionClick}
          onShipmentGroupActionClick={handleShipmentGroupActionClick}
          onSelectChange={togglePendingSelection}
          onPriceCheck={handlePriceCheck}
        />
      )}
    </div>
  );
}
