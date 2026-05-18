import { useMemo } from "react";
import { T } from "../../../constants/colors";
import { CATEGORIES } from "../../../constants/categories";
import { getStatus, monthKey, pct } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { SecTitle } from "../../shared/SecTitle";

export function AnalyticsTab({items, txs, orders}) {
  const { outTxs, currentOut, prevOut } = useMemo(() => {
    const latestTx = txs.reduce((latest, tx) => !latest || new Date(tx.created_at) > new Date(latest.created_at) ? tx : latest, null);
    const now = latestTx ? new Date(latestTx.created_at) : new Date();
    const currentMonth = now.toISOString().slice(0,7);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const prevMonth = prevMonthDate.toISOString().slice(0,7);
    const outTxs = txs.filter(tx => tx.type === "out");
    const currentOut = outTxs.filter(tx => monthKey(tx.created_at) === currentMonth);
    const prevOut = outTxs.filter(tx => monthKey(tx.created_at) === prevMonth);
    return { outTxs, currentOut, prevOut };
  }, [txs]);

  const currentTotal = useMemo(() => currentOut.reduce((sum,tx) => sum+tx.qty, 0), [currentOut]);
  const prevTotal    = useMemo(() => prevOut.reduce((sum,tx) => sum+tx.qty, 0), [prevOut]);
  const delta        = currentTotal - prevTotal;

  const activeOrders = useMemo(() => orders.filter(o => o.status === "pending" || o.status === "ordered").length, [orders]);
  const lowStock     = useMemo(() => items.filter(i => getStatus(i) !== "ok").length, [items]);

  const { byItem, maxUsed } = useMemo(() => {
    const byItem = items.map(item => {
      const used = currentOut.filter(tx => tx.item_id === item.id).reduce((sum,tx) => sum+tx.qty, 0);
      const threeMonthUsed = outTxs.filter(tx => tx.item_id === item.id).reduce((sum,tx) => sum+tx.qty, 0);
      const monthlyAvg = Math.max(0.1, threeMonthUsed / 4);
      const expectedDays = Math.round((item.current_qty / monthlyAvg) * 30);
      return {...item, used, expectedDays};
    }).sort((a,b) => b.used - a.used);
    const maxUsed = Math.max(1, ...byItem.map(i => i.used));
    return { byItem, maxUsed };
  }, [items, currentOut, outTxs]);

  const byCat = useMemo(() => CATEGORIES.map(cat => {
    const catItems = items.filter(i => i.category_id === cat.id).map(i => i.id);
    const used = currentOut.filter(tx => catItems.includes(tx.item_id)).reduce((sum,tx) => sum+tx.qty, 0);
    return {...cat, used};
  }).filter(c => c.used > 0), [items, currentOut]);

  return (
    <div>
      <Card style={{padding:20, marginBottom:16}}>
        <p style={{margin:"0 0 8px", fontSize:14, fontWeight:400, color:T.grey500}}>이번 달 출고량</p>
        <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12}}>
          <p style={{margin:0, fontSize:32, lineHeight:"40px", fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{currentTotal}</p>
          <Chip
            label={`${delta>=0?"+":""}${delta} 전월 대비`}
            color={delta>=0?T.red500:T.green500}
            bg={delta>=0?T.red50:T.green50}
            border={delta>=0?T.red50:T.green50}
          />
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:20}}>
          <div style={{background:T.grey50, borderRadius:12, padding:"12px 14px"}}>
            <p style={{margin:"0 0 4px", fontSize:12, color:T.grey500}}>주의 품목</p>
            <p style={{margin:0, fontSize:22, fontWeight:700, color:T.orange500, fontVariantNumeric:"tabular-nums"}}>{lowStock}</p>
          </div>
          <div style={{background:T.grey50, borderRadius:12, padding:"12px 14px"}}>
            <p style={{margin:"0 0 4px", fontSize:12, color:T.grey500}}>진행 발주</p>
            <p style={{margin:0, fontSize:22, fontWeight:700, color:T.blue500, fontVariantNumeric:"tabular-nums"}}>{activeOrders}</p>
          </div>
        </div>
      </Card>

      <SecTitle>많이 사용한 품목</SecTitle>
      <Card style={{marginBottom:16}}>
        {byItem.slice(0,5).map((item,i)=>(
          <div key={item.id}>
            <div style={{padding:"14px 16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:8}}>
                <div style={{minWidth:0}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                  <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>예상 소진 {item.expectedDays}일</p>
                </div>
                <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{item.used}<span style={{fontSize:12, fontWeight:400, color:T.grey500}}>{item.unit}</span></p>
              </div>
              <div style={{height:6, borderRadius:9999, background:T.grey100, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${pct(item.used,maxUsed)}%`, background:item.used===0?T.grey200:T.blue500, borderRadius:9999}}/>
              </div>
            </div>
            {i<Math.min(5,byItem.length)-1&&<Divider/>}
          </div>
        ))}
      </Card>

      <SecTitle>카테고리별 출고</SecTitle>
      <Card>
        {byCat.length>0 ? byCat.map((cat,i)=>(
          <div key={cat.id}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px"}}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <div style={{width:8, height:8, borderRadius:9999, background:cat.color}}/>
                <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{cat.name}</p>
              </div>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{cat.used}</p>
            </div>
            {i<byCat.length-1&&<Divider/>}
          </div>
        )) : (
          <p style={{margin:0, padding:"24px 16px", fontSize:14, color:T.grey500}}>이번 달 출고 기록이 아직 없어요.</p>
        )}
      </Card>
    </div>
  );
}
