import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Coins, ClipboardList, Store, TrendingUp } from "lucide-react";
import { T, font, monoFont, CS } from "../../../constants/colors";
import { CATEGORIES } from "../../../constants/categories";
import { pct } from "../../../utils/helpers";
import { compactMoney, formatMoney, highestVendorPrice, itemUnitPrice, orderUnitPrice, toNumber } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { SecTitle } from "../../shared/SecTitle";

const PERIODS = [
  { id: "current", label: "이번 달" },
  { id: "prev", label: "지난 달" },
  { id: "3months", label: "3개월" },
];

const DAY = 86400000;

function getPeriodRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  return { start, end: now };
}

function getPrevRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
  return { start, end };
}

function isInRange(value, range) {
  const date = value ? new Date(value) : null;
  return date && date >= range.start && date <= range.end;
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / DAY);
}

function usageRowsForRange(txs, items, range) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const usage = new Map();
  txs
    .filter(tx => tx.type === "out" && isInRange(tx.created_at, range))
    .forEach(tx => {
      const item = itemMap.get(tx.item_id);
      const prev = usage.get(tx.item_id) || { item, qty: 0, amount: 0 };
      const qty = toNumber(tx.qty);
      prev.qty += qty;
      prev.amount += qty * itemUnitPrice(item);
      usage.set(tx.item_id, prev);
    });
  return Array.from(usage.values()).filter(row => row.item);
}

function orderRowsForRange(orders, items, range) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const orderRows = new Map();
  orders
    .filter(order => ["ordered", "received"].includes(order.status) && isInRange(order.reviewed_at || order.requested_at, range))
    .forEach(order => {
      const item = itemMap.get(order.item_id);
      if (!item) return;
      const prev = orderRows.get(order.item_id) || { item, qty: 0, amount: 0, count: 0 };
      const qty = toNumber(order.qty);
      prev.qty += qty;
      prev.amount += orderUnitPrice(order, item) * qty;
      prev.count += 1;
      orderRows.set(order.item_id, prev);
    });
  return Array.from(orderRows.values());
}

function orderAmount(order, itemMap) {
  const item = itemMap.get(order.item_id);
  return orderUnitPrice(order, item) * toNumber(order.qty);
}

function StatCard({ label, value, sub, color = T.grey900, Icon, accent = false }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${accent ? `${color}55` : T.grey200}`, borderRadius: 12, padding: "14px 12px", boxShadow: CS, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: T.grey500, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        {Icon && (
          <span style={{ width: 28, height: 28, borderRadius: 10, background: T.grey50, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} color="currentColor" />
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 800, color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>}
    </div>
  );
}

function InsightCard({ totalCost, previousCost, topDriver, pendingAmount, wasteRiskAmount }) {
  const delta = totalCost - previousCost;
  const isUp = delta > 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;
  const tone = delta === 0 ? T.grey700 : isUp ? T.orange500 : T.green500;
  const headline = delta === 0
    ? "지난 기간과 비용 흐름이 비슷합니다"
    : `지난 기간보다 ${compactMoney(Math.abs(delta))} ${isUp ? "증가" : "감소"}했습니다`;
  const driverText = topDriver
    ? `주 원인은 ${topDriver.item.name} ${compactMoney(topDriver.deltaAmount)} 증가입니다.`
    : "뚜렷한 증가 품목은 아직 없습니다.";

  return (
    <Card style={{ padding: 16, marginBottom: 16, border: `1px solid ${delta === 0 ? T.grey200 : `${tone}55`}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.grey50, color: tone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DeltaIcon size={21} color="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: "24px", fontWeight: 800, color: T.grey900, wordBreak: "keep-all" }}>{headline}</p>
          <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: "21px", color: T.grey600, wordBreak: "keep-all" }}>{driverText}</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey500, wordBreak: "keep-all" }}>
            승인 대기 {formatMoney(pendingAmount)} · 낭비 위험 {formatMoney(wasteRiskAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function DataRows({ rows, emptyText, renderRow }) {
  if (!rows.length) {
    return (
      <Card>
        <p style={{ margin: 0, padding: "24px 16px", fontSize: 15, color: T.grey500, textAlign: "center" }}>{emptyText}</p>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 16, overflow: "hidden" }}>
      {rows.map((row, index) => (
        <div key={row.key || row.id || row.item?.id || row.name}>
          {renderRow(row, index)}
          {index < rows.length - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
}

function TopCauseRows({ rows }) {
  if (!rows.length) {
    return (
      <Card style={{ marginBottom: 16, padding: "22px 16px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", color: T.grey500, wordBreak: "keep-all" }}>
          이번 달에는 비용을 크게 흔드는 원인이 아직 없어요.
        </p>
      </Card>
    );
  }

  const iconByType = {
    order: ClipboardList,
    usage: TrendingUp,
    waste: AlertTriangle,
    category: Coins,
  };
  const colorByType = {
    order: T.orange500,
    usage: T.blue500,
    waste: T.red500,
    category: T.green500,
  };
  const bgByType = {
    order: T.orange50,
    usage: T.blue50,
    waste: T.red50,
    category: T.green50,
  };

  return (
    <Card style={{ marginBottom: 16, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = iconByType[row.type] || TrendingUp;
        const color = colorByType[row.type] || T.grey700;
        const bg = bgByType[row.type] || T.grey100;
        return (
          <div key={row.key}>
            <div style={{ padding: "15px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9999, background: T.grey900, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: monoFont, fontSize: 13, fontWeight: 800 }}>
                {index + 1}
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={19} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.title}</p>
                  <p style={{ margin: 0, flexShrink: 0, fontSize: 15, lineHeight: "20px", fontWeight: 800, color, fontFamily: monoFont }}>{formatMoney(row.amount)}</p>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>이유: {row.reason}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey500, wordBreak: "keep-all" }}>다음: {row.nextAction}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

export function AnalyticsTab({ items, txs, orders }) {
  const [period, setPeriod] = useState("current");

  const data = useMemo(() => {
    const range = getPeriodRange(period);
    const prevRange = getPrevRange(period);
    const itemMap = new Map(items.map(item => [item.id, item]));
    const periodUsageRows = usageRowsForRange(txs, items, range);
    const prevUsageRows = usageRowsForRange(txs, items, prevRange);
    const periodOrderRows = orderRowsForRange(orders, items, range);
    const prevOrderRows = orderRowsForRange(orders, items, prevRange);
    const prevByItem = new Map(prevUsageRows.map(row => [row.item.id, row]));
    const prevOrdersByItem = new Map(prevOrderRows.map(row => [row.item.id, row]));
    const periodOrders = orders.filter(order => ["ordered", "received"].includes(order.status) && isInRange(order.reviewed_at || order.requested_at, range));
    const pendingOrders = orders.filter(order => order.status === "pending");

    const usageCost = periodUsageRows.reduce((sum, row) => sum + row.amount, 0);
    const previousUsageCost = prevUsageRows.reduce((sum, row) => sum + row.amount, 0);
    const pendingAmount = pendingOrders.reduce((sum, order) => sum + orderAmount(order, itemMap), 0);
    const purchaseAmount = periodOrders.reduce((sum, order) => sum + orderAmount(order, itemMap), 0);
    const estimatedSavings = periodOrders.reduce((sum, order) => {
      const item = itemMap.get(order.item_id);
      const high = highestVendorPrice(item);
      const selected = orderUnitPrice(order, item);
      return sum + Math.max(0, high - selected) * toNumber(order.qty);
    }, 0);

    const drivers = periodUsageRows
      .map(row => {
        const previous = prevByItem.get(row.item.id) || { qty: 0, amount: 0 };
        return {
          key: row.item.id,
          item: row.item,
          qty: row.qty,
          previousQty: previous.qty,
          amount: row.amount,
          deltaAmount: row.amount - previous.amount,
          deltaQty: row.qty - previous.qty,
        };
      })
      .sort((a, b) => b.deltaAmount - a.deltaAmount);

    const wasteRows = items
      .map(item => {
        const unitPrice = itemUnitPrice(item);
        const expiryDays = daysUntil(item.expiry);
        const expiryRisk = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;
        const recentUsed = txs
          .filter(tx => tx.type === "out" && tx.item_id === item.id && isInRange(tx.created_at, getPeriodRange("3months")))
          .reduce((sum, tx) => sum + toNumber(tx.qty), 0);
        const overstockQty = Math.max(0, toNumber(item.current_qty) - Math.max(toNumber(item.min_qty) * 2, toNumber(item.min_qty) + 3));
        const staleRisk = !expiryRisk && overstockQty > 0 && recentUsed === 0;
        const riskQty = expiryRisk ? toNumber(item.current_qty) : overstockQty;
        return {
          key: item.id,
          item,
          reason: expiryRisk ? `${expiryDays}일 내 유통기한` : "최근 사용 없는 과잉재고",
          riskAmount: riskQty * unitPrice,
          riskQty,
          expiryRisk,
          staleRisk,
        };
      })
      .filter(row => (row.expiryRisk || row.staleRisk) && row.riskAmount > 0)
      .sort((a, b) => b.riskAmount - a.riskAmount);

    const vendorMap = new Map();
    periodOrders.forEach(order => {
      const vendorName = order.vendor_name || "거래처 미정";
      const prev = vendorMap.get(vendorName) || { key: vendorName, name: vendorName, count: 0, amount: 0 };
      prev.count += 1;
      prev.amount += orderAmount(order, itemMap);
      vendorMap.set(vendorName, prev);
    });
    const vendorRows = Array.from(vendorMap.values()).sort((a, b) => b.amount - a.amount);

    const categoryRows = CATEGORIES.map(category => {
      const categoryItemIds = new Set(items.filter(item => item.category_id === category.id).map(item => item.id));
      const amount = periodUsageRows
        .filter(row => categoryItemIds.has(row.item.id))
        .reduce((sum, row) => sum + row.amount, 0);
      const previousAmount = prevUsageRows
        .filter(row => categoryItemIds.has(row.item.id))
        .reduce((sum, row) => sum + row.amount, 0);
      return { ...category, amount, previousAmount, deltaAmount: amount - previousAmount };
    }).filter(row => row.amount > 0);

    const orderCauses = periodOrderRows
      .map(row => {
        const previous = prevOrdersByItem.get(row.item.id) || { amount: 0, qty: 0, count: 0 };
        return {
          key: `order-${row.item.id}`,
          type: "order",
          title: `${row.item.name} 발주 증가`,
          amount: row.amount - previous.amount,
          reason: `발주 ${row.count}건 · 이전보다 ${Math.max(0, row.qty - previous.qty)}${row.item.unit} 증가`,
          nextAction: "승인 내역과 현재 재고가 겹치지 않는지 확인",
        };
      })
      .filter(row => row.amount > 0);
    const usageCauses = drivers
      .filter(row => row.deltaAmount > 0)
      .map(row => ({
        key: `usage-${row.item.id}`,
        type: "usage",
        title: `${row.item.name} 사용 증가`,
        amount: row.deltaAmount,
        reason: `출고가 이전보다 ${row.deltaQty}${row.item.unit} 늘어남`,
        nextAction: "수술 사용량 또는 반복 출고 패턴 확인",
      }));
    const wasteCauses = wasteRows.map(row => ({
      key: `waste-${row.item.id}`,
      type: "waste",
      title: `${row.item.name} 낭비 위험`,
      amount: row.riskAmount,
      reason: `${row.reason} · ${row.riskQty}${row.item.unit} 영향`,
      nextAction: row.expiryRisk ? "우선 사용 또는 폐기 판단" : "보충 중단과 최소재고 기준 재검토",
    }));
    const categoryCauses = categoryRows
      .filter(row => row.deltaAmount > 0)
      .map(row => ({
        key: `category-${row.id}`,
        type: "category",
        title: `${row.name} 카테고리 증가`,
        amount: row.deltaAmount,
        reason: `카테고리 사용액이 이전 기간보다 ${compactMoney(row.deltaAmount)} 증가`,
        nextAction: "상위 사용 품목과 수술 스케줄을 함께 확인",
      }));
    const topCauses = [...orderCauses, ...usageCauses, ...wasteCauses, ...categoryCauses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      usageCost,
      previousUsageCost,
      pendingAmount,
      purchaseAmount,
      estimatedSavings,
      wasteRiskAmount: wasteRows.reduce((sum, row) => sum + row.riskAmount, 0),
      drivers,
      topDriver: drivers.find(row => row.deltaAmount > 0),
      wasteRows,
      vendorRows,
      categoryRows,
      topCauses,
    };
  }, [items, orders, period, txs]);

  const maxCategoryAmount = Math.max(1, ...data.categoryRows.map(row => row.amount));
  const maxVendorAmount = Math.max(1, ...data.vendorRows.map(row => row.amount));

  return (
    <div>
      <div style={{ display: "flex", background: T.grey100, borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {PERIODS.map(option => {
          const active = option.id === period;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              style={{ flex: 1, padding: "14px 0", borderRadius: 9, border: "none", background: active ? T.white : "transparent", boxShadow: active ? T.shadowControl : "none", cursor: "pointer", fontFamily: font, fontSize: 16, fontWeight: active ? 700 : 500, color: active ? T.grey900 : T.grey500, transition: "all 120ms" }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="재료 사용액" value={compactMoney(data.usageCost)} sub={`이전 ${compactMoney(data.previousUsageCost)}`} color={T.grey900} Icon={Coins} />
        <StatCard label="승인 대기액" value={compactMoney(data.pendingAmount)} sub="검토 전 발주" color={data.pendingAmount > 0 ? T.orange500 : T.grey700} Icon={ClipboardList} accent={data.pendingAmount > 0} />
        <StatCard label="낭비 위험" value={compactMoney(data.wasteRiskAmount)} sub="만료/과잉재고" color={data.wasteRiskAmount > 0 ? T.red500 : T.grey700} Icon={AlertTriangle} accent={data.wasteRiskAmount > 0} />
        <StatCard label="절감 추정" value={compactMoney(data.estimatedSavings)} sub="최저가 선택 기준" color={data.estimatedSavings > 0 ? T.green500 : T.grey700} Icon={ArrowDownRight} accent={data.estimatedSavings > 0} />
      </div>

      <InsightCard
        totalCost={data.usageCost}
        previousCost={data.previousUsageCost}
        topDriver={data.topDriver}
        pendingAmount={data.pendingAmount}
        wasteRiskAmount={data.wasteRiskAmount}
      />

      <SecTitle>{period === "current" ? "이번 달 원인 Top 3" : "선택 기간 원인 Top 3"}</SecTitle>
      <TopCauseRows rows={data.topCauses} />

      {data.categoryRows.length > 0 && (
        <>
          <SecTitle>카테고리별 비용</SecTitle>
          <Card style={{ marginBottom: 16, padding: 16 }}>
            {data.categoryRows.map((category, index) => (
              <div key={category.id} style={{ marginTop: index === 0 ? 0 : 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: category.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.grey800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category.name}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: T.grey900, fontFamily: monoFont }}>{formatMoney(category.amount)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 9999, background: T.grey100, overflow: "hidden" }}>
                  <div style={{ width: `${pct(category.amount, maxCategoryAmount)}%`, height: "100%", borderRadius: 9999, background: category.color }} />
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <SecTitle>비용 증가 원인</SecTitle>
      <DataRows
        rows={data.drivers.filter(row => row.deltaAmount > 0).slice(0, 4)}
        emptyText="이 기간에는 뚜렷한 비용 증가 품목이 없어요."
        renderRow={(row) => (
          <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: T.orange50, color: T.orange500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={19} color="currentColor" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>이전 {row.previousQty}{row.item.unit} → 현재 {row.qty}{row.item.unit}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.orange500, fontFamily: monoFont }}>{formatMoney(row.deltaAmount)}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.grey500 }}>증가</p>
            </div>
          </div>
        )}
      />

      <SecTitle>낭비 위험 품목</SecTitle>
      <DataRows
        rows={data.wasteRows.slice(0, 4)}
        emptyText="30일 내 만료 또는 장기 미사용 과잉재고가 없어요."
        renderRow={(row) => (
          <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: T.red50, color: T.red500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={19} color="currentColor" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>{row.reason} · 위험 {row.riskQty}{row.item.unit}</p>
            </div>
            <p style={{ margin: 0, flexShrink: 0, fontSize: 15, fontWeight: 800, color: T.red500, fontFamily: monoFont }}>{formatMoney(row.riskAmount)}</p>
          </div>
        )}
      />

      <SecTitle>거래처별 구매액</SecTitle>
      <DataRows
        rows={data.vendorRows.slice(0, 5)}
        emptyText="이 기간에 승인 또는 입고된 발주가 없어요."
        renderRow={(row) => (
          <div style={{ padding: "15px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Store size={19} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>{row.count}건 승인/입고</p>
              </div>
              <p style={{ margin: 0, flexShrink: 0, fontSize: 15, fontWeight: 800, color: T.grey900, fontFamily: monoFont }}>{formatMoney(row.amount)}</p>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: T.grey100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct(row.amount, maxVendorAmount)}%`, borderRadius: 9999, background: T.blue500 }} />
            </div>
          </div>
        )}
      />
    </div>
  );
}
