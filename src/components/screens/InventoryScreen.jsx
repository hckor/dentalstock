import { useEffect, useMemo, useState } from "react";
import { T } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";
import { getActiveOrder, getStatus, todayKey } from "../../utils/helpers";
import { ItemCard } from "../shared/ItemCard";
import { InventoryFilters } from "./InventoryScreen/InventoryFilters";
import { InventoryList } from "./InventoryScreen/InventoryList";
import { InventoryOwnerSummary } from "./InventoryScreen/InventoryOwnerSummary";
import { InventoryStaffSummary } from "./InventoryScreen/InventoryStaffSummary";
import {
  buildIncomingByItem,
  buildInventoryRiskRows,
  buildItemInsights,
  buildOwnerCostSummary,
  inventoryTone,
  loadSavedRisk,
  storageKeyForRole,
} from "./InventoryScreen/inventoryScreenUtils";

export function InventoryScreen({ search, setSearch, cat, setCat, currentUser, onItemClick, onExpiryClick, onBulkOrderClick }) {
  const { items } = useInventory();
  const { orders } = useOrders();
  const [risk, setRisk] = useState(() => loadSavedRisk(currentUser?.role));
  const isOwner = currentUser?.role === "owner";
  const stockToday = todayKey();
  const tone = {
    ...inventoryTone,
    incoming: { color: ORDER_ST.ordered.text, bg: ORDER_ST.ordered.bg },
  };

  const itemMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const orderedOrders = useMemo(() => orders.filter(order => order.status === "ordered"), [orders]);
  const orderedItemIds = useMemo(
    () => new Set(orderedOrders.map(order => order.item_id)),
    [orderedOrders]
  );
  const incomingByItem = useMemo(
    () => buildIncomingByItem({ orderedOrders, itemMap }),
    [itemMap, orderedOrders]
  );
  const riskRows = useMemo(
    () => buildInventoryRiskRows({ items, orderedItemIds, incomingByItem, stockToday }),
    [incomingByItem, items, orderedItemIds, stockToday]
  );
  const riskById = useMemo(() => new Map(riskRows.map(row => [row.item.id, row])), [riskRows]);
  const riskCounts = useMemo(() => ({
    all: items.length,
    low: riskRows.filter(row => row.low).length,
    expiry: riskRows.filter(row => row.expirySoon).length,
    overstock: riskRows.filter(row => row.overstock).length,
    incoming: riskRows.filter(row => row.incoming).length,
  }), [items.length, riskRows]);
  const attentionCount = useMemo(() => riskRows.filter(row => row.low || row.expirySoon).length, [riskRows]);
  const riskOptions = [
    { id: "all", label: "전체", count: riskCounts.all, color: T.grey700 },
    { id: "low", label: "부족", count: riskCounts.low, color: tone.low.color },
    { id: "expiry", label: "유통기한", count: riskCounts.expiry, color: tone.expiry.color },
    { id: "overstock", label: "과잉", count: riskCounts.overstock, color: tone.overstock.color },
    { id: "incoming", label: "입고대기", count: riskCounts.incoming, color: tone.incoming.color },
  ];
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      const row = riskById.get(item.id);
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      const matchesCategory = cat === 0 || item.category_id === cat;
      const matchesRisk =
        risk === "all" ||
        (risk === "low" && row?.low) ||
        (risk === "expiry" && row?.expirySoon) ||
        (risk === "overstock" && row?.overstock) ||
        (risk === "incoming" && row?.incoming);
      return matchesSearch && matchesCategory && matchesRisk;
    });
  }, [cat, items, risk, riskById, search]);
  const priorityRows = useMemo(() => riskRows
    .filter(row => row.priority > 0 || row.incoming)
    .sort((a, b) => b.priority - a.priority || String(a.item.name).localeCompare(String(b.item.name), "ko-KR"))
    .slice(0, 3), [riskRows]);
  const ownerCostSummary = useMemo(
    () => buildOwnerCostSummary({ riskRows, orderedOrders, itemMap }),
    [itemMap, orderedOrders, riskRows]
  );
  const ownerTopRows = useMemo(() => riskRows
    .filter(row => row.low || row.expirySoon || row.overstock || row.incoming)
    .sort((a, b) => b.businessRiskAmount - a.businessRiskAmount || b.priority - a.priority || String(a.item.name).localeCompare(String(b.item.name), "ko-KR"))
    .slice(0, 5), [riskRows]);
  const alertItems = useMemo(
    () => filteredItems.filter(i => getStatus(i) !== "ok" || riskById.get(i.id)?.expirySoon),
    [filteredItems, riskById]
  );
  const shortageItems = useMemo(() => filteredItems.filter(i => getStatus(i) !== "ok"), [filteredItems]);
  const okItems = useMemo(
    () => filteredItems.filter(i => getStatus(i) === "ok" && !riskById.get(i.id)?.expirySoon),
    [filteredItems, riskById]
  );
  const bulkableCount = useMemo(
    () => shortageItems.filter(item => !getActiveOrder(orders, item.id)).length,
    [shortageItems, orders]
  );
  const blockedShortageCount = Math.max(0, shortageItems.length - bulkableCount);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKeyForRole(currentUser?.role), risk);
    } catch {
      // 필터 저장 실패는 화면 동작을 막지 않습니다.
    }
  }, [currentUser?.role, risk]);

  const renderItem = (item) => {
    const ao = getActiveOrder(orders, item.id);
    return (
      <ItemCard
        key={item.id}
        item={item}
        isOrdered={ao?.status === "ordered"}
        ao={ao}
        insights={buildItemInsights({ item, activeOrder: ao, row: riskById.get(item.id), tone })}
        onCardClick={onItemClick}
      />
    );
  };

  return (
    <div>
      <div style={{ padding: "12px 16px 0" }}>
        {isOwner ? (
          <InventoryOwnerSummary
            attentionCount={attentionCount}
            ownerCostSummary={ownerCostSummary}
            ownerTopRows={ownerTopRows}
            inventoryTone={tone}
            onItemClick={onItemClick}
          />
        ) : (
          <InventoryStaffSummary
            items={items}
            attentionCount={attentionCount}
            orderedOrders={orderedOrders}
            priorityRows={priorityRows}
            orders={orders}
            inventoryTone={tone}
            onItemClick={onItemClick}
          />
        )}
        <InventoryFilters
          search={search}
          setSearch={setSearch}
          cat={cat}
          setCat={setCat}
          risk={risk}
          setRisk={setRisk}
          riskOptions={riskOptions}
          onExpiryClick={onExpiryClick}
        />
      </div>

      <InventoryList
        alertItems={alertItems}
        okItems={okItems}
        filteredItems={filteredItems}
        cat={cat}
        risk={risk}
        search={search}
        bulkableCount={bulkableCount}
        blockedShortageCount={blockedShortageCount}
        inventoryTone={tone}
        onBulkOrderClick={onBulkOrderClick}
        renderItem={renderItem}
      />
    </div>
  );
}
