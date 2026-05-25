import { useEffect, useMemo, useState } from "react";
import { T } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";
import { catName, daysUntil, getActiveOrder, getStatus, todayKey } from "../../utils/helpers";
import { InventoryFilters } from "./InventoryScreen/InventoryFilters";
import { InventoryList } from "./InventoryScreen/InventoryList";
import { InventoryOwnerSummary } from "./InventoryScreen/InventoryOwnerSummary";
import { InventoryStaffSummary } from "./InventoryScreen/InventoryStaffSummary";
import {
  buildIncomingByItem,
  buildInventoryRiskRows,
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
  const alertItems = useMemo(
    () => filteredItems.filter(i => {
      const row = riskById.get(i.id);
      return getStatus(i) !== "ok" || row?.expirySoon || row?.overstock || row?.incoming;
    }),
    [filteredItems, riskById]
  );
  const shortageItems = useMemo(() => filteredItems.filter(i => getStatus(i) !== "ok"), [filteredItems]);
  const okItems = useMemo(
    () => filteredItems.filter(i => {
      const row = riskById.get(i.id);
      return getStatus(i) === "ok" && !row?.expirySoon && !row?.overstock && !row?.incoming;
    }),
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

  const getItemListMeta = (item) => {
    const ao = getActiveOrder(orders, item.id);
    const row = riskById.get(item.id);
    const status = getStatus(item);
    const days = daysUntil(item.expiry);
    const statusMeta = status === "danger"
      ? { label: "소진", color: T.red500, bg: T.grey100 }
      : status === "warning"
        ? { label: "부족", color: T.orange500, bg: T.grey100 }
        : row?.expirySoon
          ? { label: "만료", color: T.red500, bg: T.grey100 }
          : row?.incoming || ao?.status === "ordered"
            ? { label: "입고대기", color: T.teal500, bg: T.grey100 }
            : row?.overstock
              ? { label: "과잉", color: T.purple500, bg: T.grey100 }
              : { label: "정상", color: T.grey600, bg: T.grey50 };
    const subText = row?.expirySoon && days !== null
      ? `만료 ${days <= 0 ? "지남" : `${days}일 전`} · ${item.location || catName(item.category_id)}`
      : `${catName(item.category_id)} · ${item.location || "위치 미등록"}`;

    return { statusMeta, subText };
  };

  const renderCompactItem = (item, index, total) => {
    const { statusMeta, subText } = getItemListMeta(item);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onItemClick?.(item)}
        style={{
          width: "100%",
          minHeight: 54,
          border: "none",
          borderBottom: index < total - 1 ? `1px solid ${T.grey100}` : "none",
          background: T.white,
          padding: "9px 12px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subText}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, width: 52 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "21px", fontWeight: 800, color: T.grey900, fontVariantNumeric: "tabular-nums" }}>
            {item.current_qty}<span style={{ marginLeft: 1, fontSize: 11, color: T.grey500, fontWeight: 700 }}>{item.unit}</span>
          </p>
        </div>
        <div style={{ flexShrink: 0, width: 50, display: "flex", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-flex", borderRadius: 9999, background: statusMeta.bg, color: statusMeta.color, padding: "3px 7px", fontSize: 11, lineHeight: "15px", fontWeight: 700 }}>
            {statusMeta.label}
          </span>
        </div>
      </button>
    );
  };

  const renderGridItem = (item) => {
    const { statusMeta, subText } = getItemListMeta(item);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onItemClick?.(item)}
        style={{
          minWidth: 0,
          minHeight: 100,
          border: `1px solid ${T.grey100}`,
          borderRadius: 12,
          background: T.white,
          padding: "12px 12px",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: T.grey900, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "keep-all" }}>{item.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subText}</p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "21px", fontWeight: 800, color: T.grey900, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {item.current_qty}<span style={{ marginLeft: 1, fontSize: 11, color: T.grey500, fontWeight: 700 }}>{item.unit}</span>
          </p>
          <span style={{ flexShrink: 0, borderRadius: 9999, background: statusMeta.bg, color: statusMeta.color, padding: "3px 7px", fontSize: 11, lineHeight: "15px", fontWeight: 700, whiteSpace: "nowrap" }}>
            {statusMeta.label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div>
      <div style={{ padding: "12px 16px 0" }}>
        {isOwner ? (
          <InventoryOwnerSummary
            attentionCount={attentionCount}
            ownerCostSummary={ownerCostSummary}
            inventoryTone={tone}
          />
        ) : (
          <InventoryStaffSummary
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
        renderCompactItem={renderCompactItem}
        renderGridItem={renderGridItem}
      />
    </div>
  );
}
