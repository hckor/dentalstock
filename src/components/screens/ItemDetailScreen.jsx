import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ArrowDownToLine, ArrowUpFromLine, Clock3, ShoppingCart, Pencil, SlidersHorizontal, Store, TrendingUp } from "lucide-react";
import { T, font, CS, monoFont } from "../../constants/colors";
import { ST } from "../../constants/itemStates";
import { ORDER_ST } from "../../constants/orderStates";
import { catName, fmtDate, fmtFull, getStatus, getActiveOrder } from "../../utils/helpers";
import { compactMoney as formatMoney, toNumber } from "../../utils/money";
import { Chip } from "../shared/Chip";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";

function StockSparkline({txs, itemId, minQty}) {
  const W = 280, H = 80, PAD = 8;
  const days = 30;

  const points = useMemo(() => {
    const now = new Date();
    const pts = [];
    let qty = 0;
    const filtered = txs.filter(tx => tx.item_id === itemId).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    for (let d = days; d >= 0; d--) {
      const date = new Date(now - d*86400000).toISOString().slice(0,10);
      const dayTxs = filtered.filter(tx => tx.created_at.slice(0,10) === date);
      dayTxs.forEach(tx => {
        if (tx.type === "in") qty += tx.qty;
        if (tx.type === "out") qty -= tx.qty;
        if (tx.type === "adjust" && Number.isFinite(tx.delta)) qty += tx.delta;
      });
      pts.push({d, qty: Math.max(0, qty)});
    }
    return pts;
  }, [txs, itemId]);

  const now = new Date();

  const maxQty = Math.max(...points.map(p=>p.qty), minQty*2, 1);
  const toX = (d) => PAD + ((days-d)/days)*(W-PAD*2);
  const toY = (q) => H - PAD - (q/maxQty)*(H-PAD*2);

  const pathD = points.map((p,i) => `${i===0?"M":"L"}${toX(p.d)},${toY(p.qty)}`).join(" ");
  const areaD = `${pathD} L${toX(0)},${H-PAD} L${toX(days)},${H-PAD} Z`;

  const labelDates = [
    new Date(now - 28*86400000).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
    new Date(now - 14*86400000).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
    new Date(now).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+18}`} style={{display:"block"}}>
      {/* 최소 보유량 기준선 */}
      <line x1={PAD} y1={toY(minQty)} x2={W-PAD} y2={toY(minQty)} stroke={T.grey300} strokeWidth={1} strokeDasharray="4 3"/>
      <text x={W-PAD} y={toY(minQty)-3} textAnchor="end" fontSize={9} fill={T.grey400}>최소 보유량 ({minQty}박스)</text>
      {/* 영역 채우기 */}
      <path d={areaD} fill={T.blue500} opacity={0.08}/>
      {/* 라인 */}
      <path d={pathD} fill="none" stroke={T.blue500} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      {/* 마지막 점 */}
      {points.length > 0 && (
        <circle cx={toX(0)} cy={toY(points[points.length-1].qty)} r={3.5} fill={T.blue500}/>
      )}
      {/* 날짜 레이블 */}
      <text x={PAD}       y={H+14} fontSize={9} fill={T.grey400}>{labelDates[0]}</text>
      <text x={W/2}       y={H+14} fontSize={9} fill={T.grey400} textAnchor="middle">{labelDates[1]}</text>
      <text x={W-PAD}     y={H+14} fontSize={9} fill={T.grey400} textAnchor="end">{labelDates[2]}</text>
    </svg>
  );
}

const DAY = 86400000;

function safeDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function inLastDays(value, days) {
  const date = safeDate(value);
  if (!date) return false;
  return Date.now() - date.getTime() <= days * DAY;
}

function formatCheckedAt(value) {
  const date = safeDate(value);
  if (!date) return "확인 전";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function buildPriceHistoryRows(priceOptions, itemOrders, item) {
  const monitorRows = priceOptions.map((option, index) => {
    const listPrice = toNumber(option.list_price_krw ?? option.list_price);
    const delta = listPrice > 0 ? option.price - listPrice : 0;
    const hasDelta = listPrice > 0 && delta !== 0;
    return {
      id: `monitor-${option.vendor_id || option.vendor_name || index}`,
      title: option.vendor_name || "거래처",
      badge: index === 0 ? "최저 후보" : "감시 가격",
      date: option.last_checked_at,
      amount: formatMoney(option.price),
      detail: hasDelta
        ? `정가 ${formatMoney(listPrice)} 대비 ${delta < 0 ? "-" : "+"}${formatMoney(Math.abs(delta))}`
        : option.in_stock === false
          ? "품절 신호가 감지됨"
          : "최근 감시 가격",
      color: hasDelta ? (delta < 0 ? T.green500 : T.orange500) : index === 0 ? T.green500 : T.grey700,
      bg: hasDelta ? (delta < 0 ? T.green50 : T.orange50) : index === 0 ? T.green50 : T.grey100,
    };
  });

  const orderRows = itemOrders
    .filter(order => toNumber(order.vendor_price) > 0)
    .slice(0, 3)
    .map(order => ({
      id: `order-${order.id}`,
      title: order.vendor_name || "발주 단가",
      badge: ORDER_ST[order.status]?.short || "발주",
      date: order.reviewed_at || order.requested_at,
      amount: formatMoney(order.vendor_price),
      detail: `${order.qty}${item?.unit || ""} 요청 · ${order.requested_by || "담당자"}`,
      color: T.blue500,
      bg: T.blue50,
    }));

  return [...monitorRows, ...orderRows]
    .sort((a, b) => (safeDate(b.date)?.getTime() || 0) - (safeDate(a.date)?.getTime() || 0))
    .slice(0, 6);
}

function StatusTimeline({ rows }) {
  return (
    <Card style={{ marginBottom: 12, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = row.Icon;
        return (
          <div key={row.label}>
            <div style={{ display: "flex", gap: 12, padding: "15px 16px", alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9999, background: row.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={row.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", fontWeight: 800, color: T.grey900 }}>{row.label}</p>
                  <span style={{ flexShrink: 0, borderRadius: 9999, padding: "3px 7px", background: row.bg, color: row.color, fontSize: 12, lineHeight: "17px", fontWeight: 800 }}>
                    {row.badge}
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>{row.detail}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

function InsightRows({ rows, emptyText }) {
  if (!rows.length) {
    return (
      <Card style={{ marginBottom: 12, padding: "18px 16px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: T.grey500 }}>{emptyText}</p>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 12, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = row.Icon;
        return (
          <div key={row.label}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "14px 16px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: row.bg, color: row.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", fontWeight: 800, color: T.grey900 }}>{row.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>{row.detail}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

export function ItemDetailScreen({item, txs, orders, onClose, onIn, onOut, onOrder, onEdit}) {
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
  const priceOptions = Array.isArray(item.vendor_options)
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
  const timelineRows = [
    {
      label: "재고 상태",
      badge: st === "ok" ? "정상" : st === "danger" ? "품절" : "부족",
      detail: st === "ok"
        ? `현재 ${item.current_qty}${item.unit}로 최소 ${item.min_qty}${item.unit} 이상입니다.`
        : `최소보다 ${Math.max(1, shortageQty)}${item.unit} 부족합니다.`,
      Icon: st === "ok" ? CheckCircle2 : AlertTriangle,
      color: st === "ok" ? T.green500 : T.red500,
      bg: st === "ok" ? T.green50 : T.red50,
    },
    {
      label: "발주 흐름",
      badge: ao ? activeOrderMeta.label : st === "ok" ? "대기 없음" : "요청 필요",
      detail: ao
        ? `${ao.requested_by || "담당자"} 요청 · ${ao.qty}${item.unit} · ${fmtDate(ao.requested_at)}`
        : st === "ok"
          ? "진행 중인 발주는 없고 재고 기준도 안정적입니다."
          : "진행 중인 발주가 없어 발주 요청이 필요합니다.",
      Icon: ShoppingCart,
      color: ao ? activeOrderMeta.text : st === "ok" ? T.green500 : T.orange500,
      bg: ao ? activeOrderMeta.bg : st === "ok" ? T.green50 : T.orange50,
    },
    {
      label: "승인/입고",
      badge: receivedOrder ? "입고 완료" : lastReviewedOrder ? "검토 완료" : ao?.status === "pending" ? "승인 대기" : "기록 없음",
      detail: receivedOrder
        ? `${fmtDate(receivedOrder.received_at || receivedOrder.reviewed_at)} 입고 완료`
        : lastReviewedOrder
          ? `${lastReviewedOrder.reviewed_by || "검토자"} · ${ORDER_ST[lastReviewedOrder.status]?.label || lastReviewedOrder.status}`
          : ao?.status === "pending"
            ? "매니저 또는 원장 검토 후 배송 흐름으로 넘어갑니다."
            : "최근 승인/입고 기록이 없습니다.",
      Icon: receivedOrder ? CheckCircle2 : Clock3,
      color: receivedOrder ? T.green500 : lastReviewedOrder ? T.blue500 : T.grey600,
      bg: receivedOrder ? T.green50 : lastReviewedOrder ? T.blue50 : T.grey100,
    },
    {
      label: "최근 입출고",
      badge: latestTx ? (latestTx.type === "in" ? "입고" : latestTx.type === "out" ? "출고" : "보정") : "이력 없음",
      detail: latestTx
        ? `${latestTx.note || (latestTx.type === "in" ? "입고" : latestTx.type === "out" ? "출고" : "재고 보정")} · ${latestTx.user} · ${fmtFull(latestTx.created_at)}`
        : "아직 이 품목의 입출고 기록이 없습니다.",
      Icon: latestTx?.type === "in" ? ArrowDownToLine : latestTx?.type === "out" ? ArrowUpFromLine : SlidersHorizontal,
      color: latestTx?.type === "in" ? T.blue500 : latestTx?.type === "out" ? T.red500 : T.grey600,
      bg: latestTx?.type === "in" ? T.blue50 : latestTx?.type === "out" ? T.red50 : T.grey100,
    },
  ];
  const shortageInsights = [
    shortageQty > 0 && {
      label: "최소 재고 미달",
      detail: `현재 ${item.current_qty}${item.unit}, 최소 ${item.min_qty}${item.unit}라서 ${shortageQty}${item.unit} 보충이 필요합니다.`,
      Icon: AlertTriangle,
      color: T.red500,
      bg: T.red50,
    },
    recentOut7 > 0 && {
      label: "최근 사용량",
      detail: `최근 7일 출고 ${recentOut7}${item.unit}, 최근 30일 출고 ${recentOut30}${item.unit}입니다.`,
      Icon: TrendingUp,
      color: T.blue500,
      bg: T.blue50,
    },
    ao && {
      label: "중복 발주 방지",
      detail: `${ao.qty}${item.unit} 발주가 이미 ${activeOrderMeta.label} 상태라 추가 요청 전 진행 상태를 확인하세요.`,
      Icon: ShoppingCart,
      color: T.teal500,
      bg: T.teal50,
    },
    recommendedMinQty > toNumber(item.min_qty) && {
      label: "최소 재고 추천",
      detail: `최근 사용량 기준 추천 최소수량은 ${recommendedMinQty}${item.unit}입니다. 현재 기준보다 ${recommendedMinQty - toNumber(item.min_qty)}${item.unit} 높아요.`,
      Icon: SlidersHorizontal,
      color: T.purple500,
      bg: T.purple50,
    },
  ].filter(Boolean);

  const infoRows = [
    {label:"카테고리", value:catName(item.category_id)},
    {label:"보관 위치",  value:item.location || "-"},
    ...(item.expiry ? [{label:"유통기한", value:item.expiry.replace(/-/g,".")}] : []),
    ...(lastOrder ? [{label:"최근 발주", value:`${lastOrder.requested_by} · ${fmtDate(lastOrder.requested_at)}`}] : []),
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:T.grey50}}>
      {/* 헤더 */}
      <div style={{background:T.white, padding:"18px 20px", borderBottom:`1px solid ${T.grey100}`}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
          <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.grey600, fontFamily:font, fontSize: 16}}>
            <ChevronLeft size={22} color={T.grey600}/> 재고 목록
          </button>
          {onEdit && (
            <button onClick={onEdit} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.blue500, fontFamily:font, fontSize: 16, fontWeight:600}}>
              <Pencil size={16}/> 수정
            </button>
          )}
        </div>
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
          <div>
            <h1 style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>{item.name}</h1>
            <div style={{display:"flex", gap:6, marginTop:6, flexWrap:"wrap"}}>
              <Chip label={sc.label} color={sc.text} bg={sc.bg}/>
              {ao && <Chip label={activeOrderMeta.label} color={activeOrderMeta.text} bg={activeOrderMeta.bg}/>}
              {item.is_temporary && item.temporary_status !== "resolved" && <Chip label="정리 필요" color={T.orange500} bg={T.orange50}/>}
            </div>
          </div>
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"16px"}}>
        {/* 현재 재고 */}
        <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"20px", marginBottom:12, display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
          <div>
            <p style={{margin:"0 0 4px", fontSize: 14, lineHeight:"22px", color:T.grey500}}>현재 재고</p>
            <p style={{margin:0, fontSize: 34, fontWeight:700, color:sc.text, fontFamily:monoFont, fontVariantNumeric:"tabular-nums", lineHeight:1}}>
              {item.current_qty}
              <span style={{fontSize: 20, fontWeight:400, color:T.grey500, marginLeft:6, fontFamily:font}}>{item.unit}</span>
            </p>
          </div>
          <p style={{margin:0, fontSize: 16, color:T.grey400}}>최소 {item.min_qty}{item.unit}</p>
        </div>

        {/* 품목 정보 */}
        <div style={{background:T.white, borderRadius:12, boxShadow:CS, marginBottom:12, overflow:"hidden"}}>
          {infoRows.map((row, i) => (
            <div key={row.label}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px"}}>
                <p style={{margin:0, fontSize: 16, color:T.grey500}}>{row.label}</p>
                <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{row.value}</p>
              </div>
              {i < infoRows.length-1 && <Divider/>}
            </div>
          ))}
        </div>

        <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>품목 상태 타임라인</p>
        <StatusTimeline rows={timelineRows} />

        <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>재고 판단</p>
        <InsightRows rows={shortageInsights} emptyText="부족 원인이나 조정할 최소 재고 신호가 없어요." />

        <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"16px", marginBottom:12}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
            <div>
              <p style={{margin:0, fontSize:16, lineHeight:"22px", fontWeight:800, color:T.grey900}}>자동 추천 최소 재고</p>
              <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>최근 7일/30일 출고량 기준</p>
            </div>
            <p style={{margin:0, fontSize:24, lineHeight:"30px", fontWeight:800, color:recommendedMinQty > toNumber(item.min_qty) ? T.purple500 : T.green500, fontFamily:monoFont}}>
              {recommendedMinQty}{item.unit}
            </p>
          </div>
          <p style={{margin:"10px 0 0", fontSize:13, lineHeight:"19px", color:T.grey600}}>
            현재 기준 {item.min_qty}{item.unit} · 최근 7일 {recentOut7}{item.unit} 출고 · 최근 30일 {recentOut30}{item.unit} 출고
          </p>
        </div>

        <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>가격 감시 히스토리</p>
        {priceOptions.length > 0 ? (
          <Card style={{marginBottom:12, overflow:"hidden"}}>
            <div style={{padding:"14px 16px", background:T.blue50}}>
              <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:800, color:T.grey900}}>
                최저 {formatMoney(lowestPrice)} · 최고 {formatMoney(highestPrice)}
              </p>
              <p style={{margin:"2px 0 0", fontSize:13, lineHeight:"19px", color:T.grey600}}>
                최근 확인 {latestCheckedAt ? formatCheckedAt(latestCheckedAt) : "확인 전"} · 가격차 {formatMoney(Math.max(0, highestPrice - lowestPrice))}
              </p>
            </div>
            {priceHistoryRows.length > 0 && (
              <div style={{padding:"12px 16px", borderBottom:`1px solid ${T.grey100}`}}>
                <p style={{margin:"0 0 8px", fontSize:13, lineHeight:"18px", fontWeight:800, color:T.grey700}}>변화 기록</p>
                <div style={{display:"flex", flexDirection:"column", gap:7}}>
                  {priceHistoryRows.map(row => (
                    <div key={row.id} style={{display:"flex", alignItems:"center", gap:9, minWidth:0}}>
                      <span style={{borderRadius:9999, padding:"3px 7px", background:row.bg, color:row.color, fontSize:11, lineHeight:"16px", fontWeight:800, whiteSpace:"nowrap"}}>{row.badge}</span>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize:13, lineHeight:"18px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{row.title} · {row.amount}</p>
                        <p style={{margin:"1px 0 0", fontSize:12, lineHeight:"17px", color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{formatCheckedAt(row.date)} · {row.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {priceOptions.map((option, index) => (
              <div key={`${option.vendor_id || option.vendor_name}-${index}`}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
                  <div style={{width:34, height:34, borderRadius:12, background:index === 0 ? T.green50 : T.grey100, color:index === 0 ? T.green500 : T.grey600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <Store size={17} color="currentColor"/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{option.vendor_name || "거래처"}</p>
                    <p style={{margin:"2px 0 0", fontSize:12, lineHeight:"17px", color:T.grey500}}>
                      {option.in_stock === false ? "품절" : "구매 가능"} · {formatCheckedAt(option.last_checked_at)}
                    </p>
                  </div>
                  <div style={{textAlign:"right", flexShrink:0}}>
                    <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:800, color:index === 0 ? T.green500 : T.grey900, fontFamily:monoFont}}>{formatMoney(option.price)}</p>
                    {option.shipping_fee > 0 && <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>배송 {formatMoney(option.shipping_fee)}</p>}
                  </div>
                </div>
                {index < priceOptions.length - 1 && <Divider/>}
              </div>
            ))}
          </Card>
        ) : (
          <Card style={{marginBottom:12, padding:"18px 16px", textAlign:"center"}}>
            <p style={{margin:0, fontSize:14, lineHeight:"20px", color:T.grey500}}>등록된 거래처 가격 후보가 없어요.</p>
          </Card>
        )}

        {/* 재고 추이 그래프 */}
        {itemTxs.length > 0 && (
          <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"16px", marginBottom:12}}>
            <p style={{margin:"0 0 12px", fontSize: 16, fontWeight:700, color:T.grey900}}>최근 30일 재고 추이</p>
            <StockSparkline txs={txs} itemId={item.id} minQty={item.min_qty}/>
          </div>
        )}

        {/* 입출고 이력 */}
        <div style={{marginBottom:80}}>
          <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>입출고 이력</p>
          {itemTxs.length === 0 ? (
            <Card style={{padding:"20px", textAlign:"center"}}>
              <p style={{margin:0, fontSize: 16, color:T.grey400}}>이력이 없어요</p>
            </Card>
          ) : (
            <Card>
              {itemTxs.slice(0,10).map((tx, i) => (
                <div key={tx.id}>
                  <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px"}}>
                    <div style={{width:44, height:44, borderRadius:9999, background:tx.type==="in"?T.blue50:tx.type==="out"?T.red50:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      {tx.type==="in"
                        ? <ArrowDownToLine size={18} color={T.blue500}/>
                        : tx.type==="out"
                          ? <ArrowUpFromLine size={18} color={T.red500}/>
                          : <SlidersHorizontal size={18} color={T.grey600}/>}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{tx.note || (tx.type==="in"?"입고":tx.type==="out"?"출고":"재고 보정")}</p>
                      <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey500}}>{tx.user} · {fmtFull(tx.created_at)}</p>
                    </div>
                    <span style={{fontSize: 16, fontWeight:700, color:tx.type==="in"?T.blue500:tx.type==="out"?T.red500:T.grey700, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>
                      {tx.type==="adjust" && tx.before_qty !== undefined && tx.after_qty !== undefined
                        ? `${tx.before_qty}→${tx.after_qty}`
                        : tx.type==="adjust"
                          ? `보정 ${tx.qty}`
                          : `${tx.type==="in"?"+":"-"}${tx.qty}`}
                    </span>
                  </div>
                  {i < Math.min(itemTxs.length,10)-1 && <Divider/>}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* 고정 하단 버튼 */}
      <div style={{position:"sticky", bottom:0, background:T.white, borderTop:`1px solid ${T.grey100}`, padding:"12px 16px 28px", display:"flex", gap:8}}>
        <button onClick={onIn} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>입고</button>
        <button onClick={onOut} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:T.grey100, color:T.red500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>출고</button>
        <button onClick={onOrder} disabled={!!ao} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:ao?T.grey100:T.blue50, color:ao?T.grey400:T.blue500, fontSize: 16, fontWeight:600, cursor:ao?"not-allowed":"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}>
          <ShoppingCart size={18}/> 발주
        </button>
      </div>
    </div>
  );
}
