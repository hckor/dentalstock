import { T } from "../../../constants/colors";
import { ShippingOrderCard } from "../../shared/ShippingOrderCard";
import { PendingApprovalCard } from "./PendingApprovalCard";
import { ReceivedGroupCard, ShipmentGroupCard } from "./ShippingTrackingGroups";
import { ShippingWorkPriorityCard } from "./ShippingWorkPriorityCard";

function StandaloneOrderCard({
  order,
  allItems,
  trackingTab,
  canApprove,
  selectedPendingIds,
  priceCheckingIds,
  duplicateInfoByOrderId,
  monthlyProjectedAmountByOrderId,
  orderActionAvailabilityByOrderId = {},
  currentUser,
  onActionClick,
  onSelectChange,
  onPriceCheck,
}) {
  const item = allItems.find(it => it.id === order.item_id);
  if (!item) return null;

  if (trackingTab === "auto_wait") {
    return (
      <PendingApprovalCard
        order={order}
        item={item}
        canApprove={canApprove}
        selected={selectedPendingIds.includes(order.id)}
        onSelectChange={() => onSelectChange(order.id)}
        priceChecking={priceCheckingIds.includes(order.id)}
        onPriceCheck={() => onPriceCheck(order)}
        duplicateInfo={duplicateInfoByOrderId[order.id]}
        monthlyProjectedAmount={monthlyProjectedAmountByOrderId[order.id]}
        actionAvailability={orderActionAvailabilityByOrderId[order.id]}
        currentUser={currentUser}
        onActionClick={(actionType) => onActionClick(order, actionType)}
      />
    );
  }

  return (
    <ShippingOrderCard
      key={order.id}
      order={order}
      item={item}
      stage={trackingTab}
      canApprove={canApprove}
      onActionClick={(actionType) => onActionClick(order, actionType)}
      selectable={trackingTab === "auto_wait" && canApprove}
      selected={selectedPendingIds.includes(order.id)}
      onSelectChange={() => onSelectChange(order.id)}
      priceChecking={priceCheckingIds.includes(order.id)}
      onPriceCheck={() => onPriceCheck(order)}
      duplicateInfo={duplicateInfoByOrderId[order.id]}
      monthlyProjectedAmount={monthlyProjectedAmountByOrderId[order.id]}
      actionAvailability={orderActionAvailabilityByOrderId[order.id]}
      currentUser={currentUser}
    />
  );
}

export function ShippingTrackingOrderList({
  trackingTab,
  currentOrders,
  completedDateGroups,
  currentShipmentGroups,
  allItems,
  canApprove,
  selectedPendingIds,
  priceCheckingIds,
  duplicateInfoByOrderId,
  monthlyProjectedAmountByOrderId,
  orderActionAvailabilityByOrderId = {},
  currentUser,
  onActionClick,
  onShipmentGroupActionClick,
  onSelectChange,
  onPriceCheck,
}) {
  return (
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
      )) : trackingTab === "in_transit" ? (
        <>
          <ShippingWorkPriorityCard groups={currentShipmentGroups} />
          {currentShipmentGroups.map(group => {
            if (group.orders.length > 1) {
              return (
                <ShipmentGroupCard
                  key={group.id}
                  group={group}
                  allItems={allItems}
                  canApprove={canApprove}
                  onActionClick={(actionType) => onShipmentGroupActionClick(group, actionType)}
                />
              );
            }
            return (
              <StandaloneOrderCard
                key={group.orders[0].id}
                order={group.orders[0]}
                allItems={allItems}
                trackingTab={trackingTab}
                canApprove={canApprove}
                selectedPendingIds={selectedPendingIds}
                priceCheckingIds={priceCheckingIds}
                duplicateInfoByOrderId={duplicateInfoByOrderId}
                monthlyProjectedAmountByOrderId={monthlyProjectedAmountByOrderId}
                orderActionAvailabilityByOrderId={orderActionAvailabilityByOrderId}
                currentUser={currentUser}
                onActionClick={onActionClick}
                onSelectChange={onSelectChange}
                onPriceCheck={onPriceCheck}
              />
            );
          })}
        </>
      ) : currentOrders.map(order => (
        <StandaloneOrderCard
          key={order.id}
          order={order}
          allItems={allItems}
          trackingTab={trackingTab}
          canApprove={canApprove}
          selectedPendingIds={selectedPendingIds}
          priceCheckingIds={priceCheckingIds}
          duplicateInfoByOrderId={duplicateInfoByOrderId}
          monthlyProjectedAmountByOrderId={monthlyProjectedAmountByOrderId}
          orderActionAvailabilityByOrderId={orderActionAvailabilityByOrderId}
          currentUser={currentUser}
          onActionClick={onActionClick}
          onSelectChange={onSelectChange}
          onPriceCheck={onPriceCheck}
        />
      ))}
    </div>
  );
}
