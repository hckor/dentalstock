import { useMemo, useState } from "react";
import { T, CS, font } from "../../constants/colors";
import { ST } from "../../constants/itemStates";
import { ORDER_ST } from "../../constants/orderStates";
import { can } from "../../constants/permissions";
import { getStatus, getActiveOrder } from "../../utils/helpers";
import { toNumber } from "../../utils/money";
import {
  BottomActions,
  CurrentStockCard,
  ItemDetailHeader,
  RecommendedMinCard,
} from "./ItemDetailScreen/ItemDetailPanels";
import {
  InsightRows,
  PriceHistoryCard,
  StatusTimeline,
  TransactionHistory,
} from "./ItemDetailScreen/ItemDetailRows";
import { StockSparkline } from "./ItemDetailScreen/StockSparkline";
import {
  buildInfoRows,
  buildPriceHistoryRows,
  buildShortageInsights,
  buildTimelineRows,
  inLastDays,
  safeDate,
} from "./ItemDetailScreen/itemDetailUtils";

export function ItemDetailScreen({item, txs, orders, currentUser = null, onClose, onIn, onOut, onOrder, onEdit}) {
  const [detailMode, setDetailMode] = useState("status");
  const st  = getStatus(item);
  const sc  = ST[st];
  const ao  = getActiveOrder(orders, item.id);
  const itemTxs = useMemo(() => txs.filter(tx=>tx.item_id===item.id).sort((a,b)=>b.created_at.localeCompare(a.created_at)), [txs, item.id]);
  const itemOrders = useMemo(() => orders.filter(o=>o.item_id===item.id).sort((a,b)=>(b.requested_at || "").localeCompare(a.requested_at || "")), [orders, item.id]);
  const lastOrder = itemOrders[0];
  const recentOut7 = useMemo(() => itemTxs.filter(tx => tx.type === "out" && inLastDays(tx.created_at, 7)).reduce((sum, tx) => sum + toNumber(tx.qty), 0), [itemTxs]);
  const recentOut30 = useMemo(() => itemTxs.filter(tx => tx.type === "out" && inLastDays(tx.created_at, 30)).reduce((sum, tx) => sum + toNumber(tx.qty), 0), [itemTxs]);
  const recommendedMinQty = Math.max(
    Number(item.min_qty) || 0,
    Math.ceil((recentOut30 / 30) * 14 + (recentOut7 / 7) * 7)
  );
  const activeOrderMeta = ao ? ORDER_ST[ao.status] || { label: ao.status, text: T.grey600, bg: T.grey100 } : null;
  const shortageQty = Math.max(0, toNumber(item.min_qty) - toNumber(item.current_qty));
  const latestTx = itemTxs[0];
  const lastReviewedOrder = itemOrders.find(order => order.reviewed_at);
  const receivedOrder = itemOrders.find(order => order.status === "received");
  const canViewPriceData = can(currentUser?.role, "cost_view") || can(currentUser?.role, "orders_price_check");
  const priceOptions = canViewPriceData && Array.isArray(item.vendor_options)
    ? item.vendor_options
      .map(option => ({ ...option, price: toNumber(option.price), shipping_fee: toNumber(option.shipping_fee) }))
      .filter(option => option.price > 0)
      .sort((a, b) => a.price - b.price)
    : [];
  const lowestPrice = priceOptions[0]?.price || 0;
  const highestPrice = priceOptions.length ? priceOptions[priceOptions.length - 1].price : 0;
  const latestCheckedAt = priceOptions
    .map(option => safeDate(option.last_checked_at))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const priceHistoryRows = buildPriceHistoryRows(priceOptions, itemOrders, item);
  const timelineRows = buildTimelineRows({ item, st, ao, activeOrderMeta, shortageQty, latestTx, lastReviewedOrder, receivedOrder });
  const shortageInsights = buildShortageInsights({ item, ao, activeOrderMeta, shortageQty, recentOut7, recentOut30, recommendedMinQty });
  const infoRows = buildInfoRows({ item, lastOrder });
  const detailModes = [
    { id: "status", label: "상태" },
    ...(canViewPriceData ? [{ id: "price", label: "가격" }] : []),
    { id: "history", label: "이력" },
  ];
  const activeDetailMode = canViewPriceData || detailMode !== "price" ? detailMode : "status";

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:T.grey50}}>
      <ItemDetailHeader item={item} sc={sc} ao={ao} activeOrderMeta={activeOrderMeta} onClose={onClose} onEdit={onEdit} />

      <div style={{flex:1, overflowY:"auto", padding:"16px"}}>
        <CurrentStockCard item={item} sc={sc} infoRows={infoRows} recentOut7={recentOut7} ao={ao} activeOrderMeta={activeOrderMeta} />

        <div style={{ display:"flex", background:T.grey100, borderRadius:9999, padding:3, margin:"0 0 14px" }}>
          {detailModes.map(mode => {
            const active = activeDetailMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDetailMode(mode.id)}
                style={{ flex:1, minHeight:38, borderRadius:9999, border:"none", background:active ? T.white : "transparent", boxShadow:active ? T.shadowControl : "none", color:active ? T.grey900 : T.grey500, fontFamily:font, fontSize:14, fontWeight:active ? 900 : 700, cursor:"pointer" }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {activeDetailMode === "status" && (
          <>
            <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>품목 상태</p>
            <StatusTimeline rows={timelineRows} />

            <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>재고 판단</p>
            <InsightRows rows={shortageInsights.slice(0, 2)} emptyText="부족 원인이나 조정할 최소 재고 신호가 없어요." />
            <RecommendedMinCard item={item} recentOut7={recentOut7} recentOut30={recentOut30} recommendedMinQty={recommendedMinQty} />
          </>
        )}

        {activeDetailMode === "price" && canViewPriceData && (
          <>
            <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>가격 감시</p>
            <PriceHistoryCard
              priceOptions={priceOptions}
              priceHistoryRows={priceHistoryRows}
              lowestPrice={lowestPrice}
              highestPrice={highestPrice}
              latestCheckedAt={latestCheckedAt}
            />
          </>
        )}

        {activeDetailMode === "history" && (
          <>
            {itemTxs.length > 0 && (
              <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"16px", marginBottom:12}}>
                <p style={{margin:"0 0 12px", fontSize: 16, fontWeight:700, color:T.grey900}}>최근 30일 재고 추이</p>
                <StockSparkline txs={txs} itemId={item.id} minQty={item.min_qty}/>
              </div>
            )}

            <TransactionHistory itemTxs={itemTxs} />
          </>
        )}
      </div>

      <BottomActions ao={ao} onIn={onIn} onOut={onOut} onOrder={onOrder} />
    </div>
  );
}
