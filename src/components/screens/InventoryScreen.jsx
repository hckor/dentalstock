import { useEffect, useMemo, useState } from "react";
import { Search, CalendarClock, ShoppingCart } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { getStatus, getActiveOrder, todayKey } from "../../utils/helpers";
import { compactMoney, itemUnitPrice, orderAmount, toNumber } from "../../utils/money";
import { Card } from "../shared/Card";
import { ItemCard } from "../shared/ItemCard";

const ALL_CATS = [{ id: 0, name: "전체", color: T.grey700 }, ...CATEGORIES];
const DAY = 86400000;

const daysUntilExpiry = (value, today) => {
  if (!value) return null;
  const expiry = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(expiry.getTime()) || Number.isNaN(base.getTime())) return null;
  return Math.ceil((expiry.getTime() - base.getTime()) / DAY);
};

const isOverstocked = (item) => {
  const minQty = Number(item.min_qty) || 0;
  const currentQty = Number(item.current_qty) || 0;
  return currentQty > Math.max(minQty * 2, minQty + 3);
};

const storageKeyForRole = (role) => `dentalstock.inventoryRisk.${role || "guest"}`;

const loadSavedRisk = (role) => {
  if (typeof window === "undefined") return "all";
  try {
    return window.localStorage.getItem(storageKeyForRole(role)) || "all";
  } catch {
    return "all";
  }
};

export function InventoryScreen({ items, search, setSearch, cat, setCat, orders, currentUser, onItemClick, onExpiryClick, onBulkOrderClick }) {
  const [risk, setRisk] = useState(() => loadSavedRisk(currentUser?.role));
  const isOwner = currentUser?.role === "owner";
  const stockToday = todayKey();
  const itemMap = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const orderedOrders = useMemo(() => orders.filter(order => order.status === "ordered"), [orders]);
  const orderedItemIds = useMemo(
    () => new Set(orderedOrders.map(order => order.item_id)),
    [orderedOrders]
  );
  const incomingByItem = useMemo(
    () => orderedOrders.reduce((map, order) => {
      const item = itemMap.get(order.item_id);
      const prev = map.get(order.item_id) || { qty: 0, amount: 0 };
      map.set(order.item_id, {
        qty: prev.qty + toNumber(order.qty),
        amount: prev.amount + orderAmount(order, item),
      });
      return map;
    }, new Map()),
    [itemMap, orderedOrders]
  );
  const riskRows = useMemo(() => items.map(item => {
    const currentQty = Number(item.current_qty) || 0;
    const minQty = Number(item.min_qty) || 0;
    const expiryDays = daysUntilExpiry(item.expiry, stockToday);
    const low = currentQty < minQty;
    const out = currentQty <= 0;
    const overstock = isOverstocked(item);
    const expirySoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 60;
    const incoming = orderedItemIds.has(item.id);
    const priority = (out ? 5 : 0) + (low ? 4 : 0) + (expirySoon ? Math.max(1, 4 - Math.floor(expiryDays / 15)) : 0) + (overstock ? 1 : 0);
    const statusText = out
      ? "품절"
      : low
        ? `부족 ${Math.max(1, minQty - currentQty)}${item.unit}`
        : expirySoon
          ? `${expiryDays}일 후 만료`
          : overstock
            ? `과잉 ${currentQty - minQty}${item.unit}`
            : incoming
              ? "입고 대기"
              : "정상";
    const unitPrice = itemUnitPrice(item);
    const shortageQty = low ? Math.max(1, minQty - currentQty) : 0;
    const overstockQty = overstock ? Math.max(0, currentQty - minQty) : 0;
    const incomingMeta = incomingByItem.get(item.id) || { qty: 0, amount: 0 };
    const shortageAmount = shortageQty * unitPrice;
    const expiryRiskAmount = expirySoon ? currentQty * unitPrice : 0;
    const overstockAmount = overstockQty * unitPrice;
    const businessRiskAmount = shortageAmount + expiryRiskAmount + overstockAmount + incomingMeta.amount;
    return {
      item,
      low,
      out,
      overstock,
      expirySoon,
      incoming,
      priority,
      statusText,
      unitPrice,
      expiryDays,
      shortageQty,
      overstockQty,
      incomingQty: incomingMeta.qty,
      incomingAmount: incomingMeta.amount,
      shortageAmount,
      expiryRiskAmount,
      overstockAmount,
      businessRiskAmount,
    };
  }), [incomingByItem, items, orderedItemIds, stockToday]);
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
    { id: "low", label: "부족", count: riskCounts.low, color: T.orange500 },
    { id: "expiry", label: "유통기한", count: riskCounts.expiry, color: T.red500 },
    { id: "overstock", label: "과잉", count: riskCounts.overstock, color: T.purple500 },
    { id: "incoming", label: "입고대기", count: riskCounts.incoming, color: T.teal500 },
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
  const ownerCostSummary = useMemo(() => {
    const shortageAmount = riskRows.reduce((sum, row) => sum + row.shortageAmount, 0);
    const expiryRiskAmount = riskRows.reduce((sum, row) => sum + row.expiryRiskAmount, 0);
    const overstockAmount = riskRows.reduce((sum, row) => sum + row.overstockAmount, 0);
    const incomingAmount = orderedOrders.reduce((sum, order) => sum + orderAmount(order, itemMap.get(order.item_id)), 0);
    return { shortageAmount, expiryRiskAmount, overstockAmount, incomingAmount };
  }, [itemMap, orderedOrders, riskRows]);
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

  const buildInsights = (item, activeOrder) => {
    const row = riskById.get(item.id);
    if (!row) return [];
    const currentQty = Number(item.current_qty) || 0;
    const minQty = Number(item.min_qty) || 0;
    const unitPrice = row.unitPrice;
    const insights = [];

    if (row.low) {
      const shortageQty = Math.max(1, minQty - currentQty);
      insights.push({
        label: unitPrice ? `보충 예상 ${compactMoney(shortageQty * unitPrice)}` : "보충 비용 미확인",
        color: T.orange500,
        bg: T.orange50,
      });
    }
    if (row.expirySoon) {
      insights.push({
        label: unitPrice ? `낭비 위험 ${compactMoney(currentQty * unitPrice)}` : "유통기한 비용 미확인",
        color: T.red500,
        bg: T.red50,
      });
    }
    if (row.overstock) {
      const overQty = Math.max(0, currentQty - minQty);
      insights.push({
        label: unitPrice ? `과잉 묶인 금액 ${compactMoney(overQty * unitPrice)}` : "과잉 비용 미확인",
        color: T.purple500,
        bg: T.purple50,
      });
    }
    if (activeOrder) {
      insights.push({
        label: `${activeOrder.qty}${item.unit} 발주 진행 중`,
        color: T.teal500,
        bg: T.teal50,
      });
    }
    if (!row.low && !row.expirySoon && !row.overstock && !activeOrder) {
      insights.push({
        label: "현재 조치 필요 없음",
        color: T.green500,
        bg: T.green50,
      });
    }
    return insights.slice(0, 3);
  };

  const renderItem = (item) => {
    const ao = getActiveOrder(orders, item.id);
    return (
      <ItemCard
        key={item.id}
        item={item}
        isOrdered={ao?.status === "ordered"}
        ao={ao}
        insights={buildInsights(item, ao)}
        onCardClick={onItemClick}
      />
    );
  };

  const renderOwnerTopReason = (row) => {
    const reasons = [];
    if (row.low) reasons.push(`보충 ${compactMoney(row.shortageAmount)}`);
    if (row.expirySoon) reasons.push(`손실위험 ${compactMoney(row.expiryRiskAmount)}`);
    if (row.overstock) reasons.push(`과잉 ${compactMoney(row.overstockAmount)}`);
    if (row.incoming) reasons.push(`입고대기 ${compactMoney(row.incomingAmount)}`);
    return reasons.filter(Boolean).slice(0, 2).join(" · ") || row.statusText;
  };

  const ownerRiskTone = (row) => {
    if (row.expirySoon) return T.red500;
    if (row.low) return T.orange500;
    if (row.overstock) return T.purple500;
    if (row.incoming) return T.teal500;
    return T.grey700;
  };

  return (
    <div>
      {/* 검색 + 유통기한 */}
      <div style={{ padding: "12px 16px 0" }}>
        {isOwner ? (
          <Card style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 900, color: T.grey900 }}>경영자용 재고 요약</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>재고 수량보다 비용 영향이 큰 항목을 먼저 보여줍니다.</p>
              </div>
              <span style={{ flexShrink: 0, borderRadius: 9999, background: attentionCount > 0 ? T.orange50 : T.green50, color: attentionCount > 0 ? T.orange500 : T.green500, padding: "6px 9px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
                확인 {ownerTopRows.length}건
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ownerTopRows.length ? 12 : 0 }}>
              {[
                { label: "부족 보충 예상액", value: compactMoney(ownerCostSummary.shortageAmount), color: ownerCostSummary.shortageAmount > 0 ? T.orange500 : T.grey700 },
                { label: "유통기한 손실 위험액", value: compactMoney(ownerCostSummary.expiryRiskAmount), color: ownerCostSummary.expiryRiskAmount > 0 ? T.red500 : T.grey700 },
                { label: "과잉재고 묶인 금액", value: compactMoney(ownerCostSummary.overstockAmount), color: ownerCostSummary.overstockAmount > 0 ? T.purple500 : T.grey700 },
                { label: "입고대기 금액", value: compactMoney(ownerCostSummary.incomingAmount), color: ownerCostSummary.incomingAmount > 0 ? T.teal500 : T.grey700 },
              ].map(summary => (
                <div key={summary.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "11px 10px" }}>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 18, lineHeight: "23px", fontWeight: 900, color: summary.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.value}</p>
                </div>
              ))}
            </div>
            {ownerTopRows.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 900, color: T.grey700 }}>확인 필요 Top 5</p>
                {ownerTopRows.map((row, index) => {
                  const tone = ownerRiskTone(row);
                  return (
                    <button
                      key={row.item.id}
                      type="button"
                      onClick={() => onItemClick(row.item)}
                      style={{ width: "100%", border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, padding: "10px 11px", textAlign: "left", cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 9 }}
                    >
                      <span style={{ width: 22, height: 22, borderRadius: 9999, background: T.grey100, color: index === 0 ? tone : T.grey700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 900 }}>
                        {index + 1}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", margin: 0, fontSize: 14, lineHeight: "19px", fontWeight: 900, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</span>
                        <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          현재 {row.item.current_qty}{row.item.unit} · 최소 {row.item.min_qty}{row.item.unit}
                        </span>
                      </span>
                      <span style={{ flexShrink: 0, maxWidth: "45%", border: `1px solid ${T.grey100}`, borderRadius: 9999, background: T.grey50, color: tone, padding: "5px 8px", fontSize: 12, lineHeight: "16px", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {renderOwnerTopReason(row)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "전체 재고", value: items.length, color: T.blue500 },
                { label: "확인 필요", value: attentionCount, color: T.orange500 },
                { label: "입고 대기", value: orderedOrders.length, color: T.teal500 },
              ].map(summary => (
                <Card key={summary.label} style={{ padding: "12px 10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 16, color: T.grey500 }}>{summary.label}</p>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: summary.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>{summary.value}</p>
                </Card>
              ))}
            </div>

            {priorityRows.length > 0 && (
          <Card style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: "20px", fontWeight: 800, color: T.grey900 }}>재고 리스크 우선순위</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>부족, 유통기한, 입고대기를 먼저 봅니다.</p>
              </div>
              <span style={{ flexShrink: 0, borderRadius: 9999, background: T.orange50, color: T.orange500, padding: "5px 9px", fontSize: 12, fontWeight: 800 }}>
                {priorityRows.length}건
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {priorityRows.map(({ item, statusText, low, expirySoon, incoming, overstock }) => {
                const activeOrder = getActiveOrder(orders, item.id);
                const tone = low ? T.orange500 : expirySoon ? T.red500 : incoming ? T.teal500 : overstock ? T.purple500 : T.grey600;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemClick(item)}
                    style={{ width: "100%", border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, padding: "11px 12px", textAlign: "left", cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 9999, background: tone, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: "19px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        현재 {item.current_qty}{item.unit} · 최소 {item.min_qty}{item.unit}{activeOrder ? ` · ${activeOrder.qty}${item.unit} 배송 중` : ""}
                      </p>
                    </div>
                    <span style={{ flexShrink: 0, borderRadius: 9999, background: `${tone}14`, color: tone, padding: "5px 8px", fontSize: 12, fontWeight: 800 }}>
                      {statusText}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
              <Search size={18} color={T.grey400} />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="품목명 검색"
              style={{ width: "100%", height: 44, padding: "10px 16px 10px 40px", borderRadius: 12, border: `1px solid ${T.inputBorder}`, background: T.inputBg, fontSize: 16, color: T.text, fontFamily: font, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={onExpiryClick}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 44, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.grey200}`, background: T.white, color: T.grey700, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}
          >
            <CalendarClock size={18} color={T.grey600} /> 유통기한
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
          {ALL_CATS.map(c => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  flexShrink: 0,
                  padding: "7px 14px",
                  borderRadius: 12,
                  border: active ? "none" : `1px solid ${T.grey200}`,
                  background: active ? T.blue500 : T.white,
                  color: active ? T.white : T.grey600,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 120ms",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
          {riskOptions.map(option => {
            const active = risk === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRisk(option.id)}
                style={{
                  flexShrink: 0,
                  minHeight: 36,
                  padding: "8px 12px",
                  borderRadius: 9999,
                  border: active ? `1px solid ${option.color}` : `1px solid ${T.grey200}`,
                  background: active ? `${option.color}14` : T.white,
                  color: active ? option.color : T.grey600,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: font,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{option.label}</span>
                <span style={{ fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>{option.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "4px 16px 24px" }}>
        {/* 확인 필요 섹션 */}
        {alertItems.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: 9999, background: T.red500, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700, flex: 1 }}>확인 필요 {alertItems.length}</p>
              <button
                type="button"
                onClick={onBulkOrderClick}
                disabled={!bulkableCount}
                title={blockedShortageCount ? `${blockedShortageCount}건은 이미 발주 진행 중이라 제외됩니다` : undefined}
                style={{
                  minHeight: 38,
                  padding: "9px 13px",
                  borderRadius: 9999,
                  border: "none",
                  background: bulkableCount ? T.blue500 : T.grey200,
                  color: bulkableCount ? T.white : T.grey500,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: bulkableCount ? "pointer" : "default",
                  fontFamily: font,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <ShoppingCart size={16} />
                {bulkableCount ? `부족 ${bulkableCount}건 발주` : "부족 품목 발주 중"}
              </button>
            </div>
            {blockedShortageCount > 0 && (
              <p style={{ margin: "-4px 0 10px", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>
                이미 발주 중인 {blockedShortageCount}건은 중복 요청에서 제외됩니다.
              </p>
            )}
            {alertItems.map(renderItem)}
            {okItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 9999, background: T.green500 }} />
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700 }}>정상</p>
              </div>
            )}
          </>
        )}

        {/* 정상 품목 */}
        {okItems.map(renderItem)}

        {filteredItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ margin: 0, fontSize: 16, color: T.grey400 }}>
              {cat !== 0 || risk !== "all" || search.trim()
                ? "조건에 맞는 재고가 없어요"
                : "품목이 없어요"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
