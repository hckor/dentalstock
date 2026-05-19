import { useMemo } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, ChevronRight,
  AlertTriangle, ShoppingCart, PackageCheck,
  CalendarDays, ClipboardCheck, ClipboardList, Edit2
} from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { ORDER_ST } from "../../constants/orderStates";
import { ST } from "../../constants/itemStates";
import { SURGERY_PRESETS } from "../../constants/surgeryPresets";
import { getStatus, todayKey, fmtDate, getActiveOrder } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { Chip } from "../shared/Chip";
import { SecTitle } from "../shared/SecTitle";

export function HomeScreen({items, txs, orders, surgeries, setTab, openModal, currentUser, canApprove, confirmSurgeryPrep, openItemsEditor, updateSurgeryItems}) {

  const pendingOrders  = useMemo(() => orders.filter(o => o.status === "pending"),  [orders]);
  const waitingOrders  = useMemo(() => orders.filter(o => o.status === "ordered"),  [orders]);
  const alertItems     = useMemo(() => items.filter(i => getStatus(i) !== "ok"),    [items]);
  const todaySurgeries = useMemo(() => surgeries.filter(s => s.scheduled_date === todayKey()).sort((a,b) => (a.scheduled_time||"").localeCompare(b.scheduled_time||"")), [surgeries]);

  const stats = useMemo(() => [
    {label:"전체",    value:items.length,                                           color:T.grey900},
    {label:"정상",    value:items.filter(i=>getStatus(i)==="ok").length,            color:T.green500},
    {label:"부족",    value:items.filter(i=>getStatus(i)==="warning").length,       color:T.orange500},
    {label:"소진",    value:items.filter(i=>getStatus(i)==="danger").length,        color:T.red500},
  ], [items]);

  const tasks = useMemo(() => {
    const list = [];
    if (canApprove && pendingOrders.length > 0) {
      const first = pendingOrders[0];
      const itemName = items.find(i => i.id === first.item_id)?.name || "";
      list.push({id:"pending", Icon:ClipboardList, iconBg:T.orange50, iconColor:T.orange500, title:`발주 승인 대기 ${pendingOrders.length}건`, sub:`${itemName} · ${first.requested_by} 요청`, action:"검토", actionBg:T.red500, onClick:()=>setTab("admin")});
    }
    if (!canApprove && alertItems.length > 0) {
      list.push({id:"alerts", Icon:AlertTriangle, iconBg:T.red50, iconColor:T.red500, title:`재고 부족 품목 ${alertItems.length}건`, sub:`${alertItems[0]?.name} · 발주 요청 필요`, action:"발주", actionBg:T.red500, onClick:()=>setTab("order")});
    }
    if (waitingOrders.length > 0) {
      list.push({id:"waiting", Icon:PackageCheck, iconBg:T.blue50, iconColor:T.blue500, title:`배송 도착 ${waitingOrders.length}건`, sub:"재고에 등록해주세요", action:"확인", actionBg:T.blue500, onClick:()=>setTab("inventory")});
    }
    return list;
  }, [canApprove, pendingOrders, alertItems, waitingOrders, items, setTab]);

  return (
    <div style={{paddingBottom:24}}>

      {/* ── 오늘 해야 할 일 ── */}
      {tasks.length > 0 && (
        <div style={{padding:"16px 16px 0"}}>
          <Card style={{overflow:"hidden", padding:0}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 10px"}}>
              <p style={{margin:0, fontSize:13, fontWeight:700, color:T.grey700}}>오늘 해야 할 일</p>
              <span style={{fontSize:12, fontWeight:700, color:T.blue500}}>{tasks.length}건</span>
            </div>
            {tasks.map((task, i) => {
              const Icon = task.Icon;
              return (
                <div key={task.id}>
                  {i > 0 && <Divider/>}
                  <button onClick={task.onClick} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                    <div style={{width:36, height:36, borderRadius:10, background:task.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      <Icon size={17} color={task.iconColor}/>
                    </div>
                    <div style={{flex:1, textAlign:"left", minWidth:0}}>
                      <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey900}}>{task.title}</p>
                      {task.sub && <p style={{margin:"2px 0 0", fontSize:11, color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{task.sub}</p>}
                    </div>
                    <span style={{flexShrink:0, padding:"6px 14px", borderRadius:9999, background:task.actionBg, color:T.white, fontSize:12, fontWeight:700}}>{task.action}</span>
                  </button>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── 오늘 수술 (compact) ── */}
      {todaySurgeries.map(surgery => {
        const shortages = surgery.required_items.filter(req => {
          const item = items.find(i => i.id === req.item_id);
          return !item || item.current_qty < req.qty;
        });
        const allOk = shortages.length === 0;
        return (
          <div key={surgery.id} style={{padding:"12px 16px 0"}}>
            <button
              onClick={() => openItemsEditor(surgery.required_items, (newItems) => updateSurgeryItems(surgery.id, newItems), `${surgery.scheduled_time} · ${surgery.title}`)}
              style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:14, background:surgery.prep_confirmed ? T.green50 : T.white, boxShadow:CS, border:"none", cursor:"pointer", fontFamily:font, textAlign:"left"}}
            >
              <div style={{width:36, height:36, borderRadius:9999, background:surgery.prep_confirmed?T.green500:allOk?T.blue500:T.orange500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                {surgery.prep_confirmed ? <ClipboardCheck size={17} color={T.white}/> : <CalendarDays size={17} color={T.white}/>}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>{surgery.patient}님</p>
                <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                  {surgery.scheduled_time} · {surgery.title} · 준비 품목 {surgery.required_items.length}종 {allOk?"모두 충분":`${shortages.length}종 부족`}
                </p>
              </div>
              {!surgery.prep_confirmed && (
                <button
                  onClick={e=>{e.stopPropagation(); confirmSurgeryPrep(surgery.id);}}
                  style={{flexShrink:0, padding:"7px 14px", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:font}}
                >확인</button>
              )}
              {surgery.prep_confirmed && <ChevronRight size={16} color={T.grey400}/>}
            </button>
          </div>
        );
      })}

      {/* ── 재고 통계 ── */}
      <div style={{padding:"16px 16px 0"}}>
        <div style={{display:"flex", background:T.white, borderRadius:14, boxShadow:CS, overflow:"hidden"}}>
          {stats.map((s, i) => (
            <button key={s.label} onClick={()=>setTab("inventory")} style={{flex:1, padding:"16px 0", border:"none", background:"none", cursor:"pointer", fontFamily:font, textAlign:"center", borderRight:i<stats.length-1?`1px solid ${T.grey100}`:"none"}}>
              <p style={{margin:0, fontSize:24, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
              <p style={{margin:"3px 0 0", fontSize:11, color:T.grey500}}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── 최근 입출고 ── */}
      <div style={{padding:"16px 16px 0"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <SecTitle>최근 입출고</SecTitle>
          <button onClick={()=>setTab("inout")} style={{fontSize:13, color:T.blue500, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600}}>전체보기</button>
        </div>
        <Card>
          {txs.length === 0 ? (
            <p style={{margin:0, padding:"24px 16px", fontSize:14, color:T.grey400, textAlign:"center"}}>입출고 이력이 없어요</p>
          ) : txs.slice(0,5).map((tx, i) => {
            const item = items.find(it => it.id === tx.item_id);
            return (
              <div key={tx.id}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"13px 16px"}}>
                  <div style={{width:32, height:32, borderRadius:9999, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {tx.type==="in" ? <ArrowDownToLine size={15} color={T.blue500}/> : <ArrowUpFromLine size={15} color={T.red500}/>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                    <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>{tx.user} · {fmtDate(tx.created_at)}</p>
                  </div>
                  <span style={{fontSize:15, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</span>
                </div>
                {i < Math.min(txs.length,5)-1 && <Divider/>}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
