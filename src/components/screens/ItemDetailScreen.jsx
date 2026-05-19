import { useMemo } from "react";
import { ChevronLeft, ArrowDownToLine, ArrowUpFromLine, ShoppingCart } from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ST } from "../../constants/itemStates";
import { ORDER_ST } from "../../constants/orderStates";
import { catName, fmtDate, fmtFull, getStatus, getActiveOrder } from "../../utils/helpers";
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
      dayTxs.forEach(tx => { qty += tx.type === "in" ? tx.qty : -tx.qty; });
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

export function ItemDetailScreen({item, txs, orders, onClose, onIn, onOut, onOrder}) {
  const st  = getStatus(item);
  const sc  = ST[st];
  const ao  = getActiveOrder(orders, item.id);
  const itemTxs = useMemo(() => txs.filter(tx=>tx.item_id===item.id).sort((a,b)=>b.created_at.localeCompare(a.created_at)), [txs, item.id]);
  const lastOrder = useMemo(() => orders.filter(o=>o.item_id===item.id).sort((a,b)=>b.requested_at.localeCompare(a.requested_at))[0], [orders, item.id]);

  const infoRows = [
    {label:"카테고리", value:catName(item.category_id)},
    {label:"보관 위치",  value:item.location || "-"},
    ...(item.expiry ? [{label:"유통기한", value:item.expiry.replace(/-/g,".")}] : []),
    ...(lastOrder ? [{label:"최근 발주", value:`${lastOrder.requested_by} · ${fmtDate(lastOrder.requested_at)}`}] : []),
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:T.grey50}}>
      {/* 헤더 */}
      <div style={{background:T.white, padding:"16px 16px", borderBottom:`1px solid ${T.grey100}`}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
          <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.grey600, fontFamily:font, fontSize:16}}>
            <ChevronLeft size={20} color={T.grey600}/> 재고 목록
          </button>
        </div>
        <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
          <div>
            <h1 style={{margin:0, fontSize:24, fontWeight:700, color:T.grey900}}>{item.name}</h1>
            <div style={{display:"flex", gap:6, marginTop:6, flexWrap:"wrap"}}>
              <Chip label={sc.label} color={sc.text} bg={sc.bg}/>
              {ao && <Chip label={ORDER_ST[ao.status].label} color={ORDER_ST[ao.status].text} bg={ORDER_ST[ao.status].bg}/>}
            </div>
          </div>
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"16px"}}>
        {/* 현재 재고 */}
        <div style={{background:T.white, borderRadius:14, boxShadow:CS, padding:"16px 24px", marginBottom:12, display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
          <div>
            <p style={{margin:"0 0 4px", fontSize:12, color:T.grey500}}>현재 재고</p>
            <p style={{margin:0, fontSize:48, fontWeight:700, color:sc.text, fontVariantNumeric:"tabular-nums", lineHeight:1}}>
              {item.current_qty}
              <span style={{fontSize:18, fontWeight:500, color:T.grey500, marginLeft:6}}>{item.unit}</span>
            </p>
          </div>
          <p style={{margin:0, fontSize:14, color:T.grey400}}>최소 {item.min_qty}{item.unit}</p>
        </div>

        {/* 품목 정보 */}
        <div style={{background:T.white, borderRadius:14, boxShadow:CS, marginBottom:12, overflow:"hidden"}}>
          {infoRows.map((row, i) => (
            <div key={row.label}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 16px"}}>
                <p style={{margin:0, fontSize:14, color:T.grey500}}>{row.label}</p>
                <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{row.value}</p>
              </div>
              {i < infoRows.length-1 && <Divider/>}
            </div>
          ))}
        </div>

        {/* 재고 추이 그래프 */}
        {itemTxs.length > 0 && (
          <div style={{background:T.white, borderRadius:14, boxShadow:CS, padding:"16px", marginBottom:12}}>
            <p style={{margin:"0 0 12px", fontSize:16, fontWeight:700, color:T.grey900}}>최근 30일 재고 추이</p>
            <StockSparkline txs={txs} itemId={item.id} minQty={item.min_qty}/>
          </div>
        )}

        {/* 입출고 이력 */}
        <div style={{marginBottom:80}}>
          <p style={{margin:"0 0 10px", fontSize:16, fontWeight:700, color:T.grey900}}>입출고 이력</p>
          {itemTxs.length === 0 ? (
            <Card style={{padding:"20px", textAlign:"center"}}>
              <p style={{margin:0, fontSize:14, color:T.grey400}}>이력이 없어요</p>
            </Card>
          ) : (
            <Card>
              {itemTxs.slice(0,10).map((tx, i) => (
                <div key={tx.id}>
                  <div style={{display:"flex", alignItems:"center", gap:12, padding:"16px 16px"}}>
                    <div style={{width:40, height:40, borderRadius:9999, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      {tx.type==="in" ? <ArrowDownToLine size={16} color={T.blue500}/> : <ArrowUpFromLine size={16} color={T.red500}/>}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{tx.note || (tx.type==="in"?"입고":"출고")}</p>
                      <p style={{margin:"1px 0 0", fontSize:11, color:T.grey500}}>{tx.user} · {fmtFull(tx.created_at)}</p>
                    </div>
                    <span style={{fontSize:16, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</span>
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
        <button onClick={onIn} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:font}}>입고</button>
        <button onClick={onOut} style={{flex:1, padding:"16px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:font}}>출고</button>
        <button onClick={onOrder} disabled={!!ao} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:ao?T.grey100:T.blue50, color:ao?T.grey400:T.blue500, fontSize:16, fontWeight:700, cursor:ao?"not-allowed":"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}>
          <ShoppingCart size={16}/> 발주
        </button>
      </div>
    </div>
  );
}
