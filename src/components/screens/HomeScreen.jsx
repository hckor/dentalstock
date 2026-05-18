import { useState } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, ChevronRight, AlertTriangle, X,
  Edit2, ShoppingCart, ClipboardList, PackageCheck, CalendarDays, ClipboardCheck
} from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { ORDER_ST } from "../../constants/orderStates";
import { ST } from "../../constants/itemStates";
import { SURGERY_PRESETS } from "../../constants/surgeryPresets";
import { getStatus, catName, catColor, todayKey, fmtDate, getActiveOrder } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { Chip } from "../shared/Chip";
import { Avatar } from "../shared/Avatar";
import { SecTitle } from "../shared/SecTitle";

export function HomeScreen({items, txs, orders, surgeries, setTab, openModal, currentUser, canApprove, confirmSurgeryPrep, openItemsEditor, updateSurgeryItems}) {
  const [statFilter, setStatFilter] = useState(null);
  const alertItems    = items.filter(i=>getStatus(i)!=="ok");
  const pendingCount  = orders.filter(o=>o.status==="pending").length;
  const waitingCount  = orders.filter(o=>o.status==="ordered").length; // 입고 대기
  const myOrders      = orders.filter(o=>o.requested_by===currentUser.name).slice(0,3);
  const todaySurgeries = surgeries.filter(s=>s.scheduled_date===todayKey()).sort((a,b)=>(a.scheduled_time||"").localeCompare(b.scheduled_time||""));

  const stats = [
    {id:"all",     label:"전체 품목", value:items.length,                                    color:T.grey900,  items},
    {id:"ok",      label:"정상",      value:items.filter(i=>getStatus(i)==="ok").length,     color:T.green500, items:items.filter(i=>getStatus(i)==="ok")},
    {id:"warning", label:"재고 부족", value:items.filter(i=>getStatus(i)==="warning").length,color:T.orange500,items:items.filter(i=>getStatus(i)==="warning")},
    {id:"danger",  label:"재고 소진", value:items.filter(i=>getStatus(i)==="danger").length, color:T.red500,   items:items.filter(i=>getStatus(i)==="danger")},
  ];
  const selectedStat = stats.find(s=>s.id===statFilter);

  return (
    <div>
      <div style={{padding:"16px 16px 0"}}>
        <Card style={{padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12}}>
          <Avatar name={currentUser.name} role={currentUser.role} size={44}/>
          <div>
            <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{currentUser.name}님, 안녕하세요</p>
            <span style={{fontSize:12, fontWeight:600, color:ROLE_META[currentUser.role].color}}>{ROLE_META[currentUser.role].label}</span>
          </div>
        </Card>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16}}>
          {stats.map(s=>{
            const active = statFilter===s.id;
            return (
              <button key={s.id} onClick={()=>setStatFilter(active?null:s.id)}
                style={{textAlign:"left", padding:"14px 16px", border:"none", borderRadius:12, background:T.white, boxShadow:active?"0px 0px 0px 2px #2563eb, 0px 2px 8px rgba(0,0,0,0.08)":CS, cursor:"pointer", fontFamily:font}}>
                <p style={{margin:"0 0 4px", fontSize:12, color:active?T.blue500:T.grey500, fontWeight:active?600:400}}>{s.label}</p>
                <p style={{margin:0, fontSize:26, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
              </button>
            );
          })}
        </div>

        {selectedStat&&(
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px"}}>
              <div>
                <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>{selectedStat.label} 상세</p>
                <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{selectedStat.value}개 품목</p>
              </div>
              <button onClick={()=>setStatFilter(null)} style={{border:"none", background:T.grey100, width:32, height:32, borderRadius:9999, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <X size={16} color={T.grey600}/>
              </button>
            </div>
            {selectedStat.items.length>0 ? selectedStat.items.map((item,i)=>{
              const sc = ST[getStatus(item)];
              const ao = getActiveOrder(orders, item.id);
              return (
                <div key={item.id}>
                  <button onClick={()=>openModal(getStatus(item)==="ok"?"out":"in",item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                    <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
                    <div style={{flex:1, textAlign:"left", minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{catName(item.category_id)} · {item.current_qty}{item.unit} / 최소 {item.min_qty}{item.unit}</p>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                      <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                      {ao&&<Chip label={ORDER_ST[ao.status].short} color={ORDER_ST[ao.status].text} bg={ORDER_ST[ao.status].bg} border={ORDER_ST[ao.status].border}/>}
                    </div>
                  </button>
                  {i<selectedStat.items.length-1&&<Divider/>}
                </div>
              );
            }) : (
              <p style={{margin:0, padding:"0 16px 18px", fontSize:14, color:T.grey500}}>조건에 맞는 품목이 없어요.</p>
            )}
          </Card>
        )}
      </div>

      {todaySurgeries.length>0&&(
        <div style={{padding:"0 16px 16px"}}>
          <SecTitle>오늘 수술 준비</SecTitle>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {todaySurgeries.map(surgery=>{
              const preset = SURGERY_PRESETS[surgery.type];
              const shortages = surgery.required_items.filter(req=>{
                const item = items.find(i=>i.id===req.item_id);
                return !item || item.current_qty < req.qty;
              });
              return (
                <Card key={surgery.id} style={{padding:"16px"}}>
                  <div style={{display:"flex", alignItems:"flex-start", gap:12, marginBottom:12}}>
                    <div style={{width:40, height:40, borderRadius:12, background:surgery.prep_confirmed?T.green50:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      {surgery.prep_confirmed?<ClipboardCheck size={20} color={T.green500}/>:<CalendarDays size={20} color={T.blue500}/>}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap"}}>
                        <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{surgery.title}</p>
                        <Chip label={preset?.label||"수술"} color={T.blue500} bg={T.blue50} border={T.blue50}/>
                      </div>
                      <p style={{margin:0, fontSize:12, color:T.grey500}}>{surgery.scheduled_time} · 환자 {surgery.patient}</p>
                    </div>
                    <Chip label={surgery.prep_confirmed?"준비완료":shortages.length>0?"부족확인":"준비필요"} color={surgery.prep_confirmed?T.green500:shortages.length>0?T.orange500:T.blue500} bg={surgery.prep_confirmed?T.green50:shortages.length>0?T.orange50:T.blue50} border={T.grey200}/>
                  </div>
                  <div style={{background:T.grey50, borderRadius:12, padding:"10px 12px", marginBottom:12}}>
                    {surgery.required_items.map((req,i)=>{
                      const item = items.find(it=>it.id===req.item_id);
                      const enough = item && item.current_qty>=req.qty;
                      return (
                        <div key={`${surgery.id}-${req.item_id}`} style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:i===0?"0 0 8px":i===surgery.required_items.length-1?"8px 0 0":"8px 0", borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                          <div style={{minWidth:0}}>
                            <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</p>
                            <p style={{margin:"2px 0 0", fontSize:11, color:T.grey500}}>필요 {req.qty}{item?.unit||""} · 현재 {item?.current_qty??0}{item?.unit||""}</p>
                          </div>
                          <Chip label={enough?"가능":"부족"} color={enough?T.green500:T.red500} bg={enough?T.green50:T.red50} border={T.grey200}/>
                        </div>
                      );
                    })}
                  </div>
                  {surgery.note&&<p style={{margin:"0 0 12px", fontSize:12, color:T.grey600}}>메모: {surgery.note}</p>}
                  {surgery.prep_confirmed ? (
                    <button disabled style={{width:"100%", padding:"12px 0", borderRadius:9999, border:"none", background:T.grey100, color:T.grey500, fontSize:14, fontWeight:600, cursor:"default", fontFamily:font}}>
                      {surgery.prepared_by} 준비 완료
                    </button>
                  ) : (
                    <div style={{display:"flex", gap:8}}>
                      <button
                        onClick={()=>openItemsEditor(surgery.required_items, (newItems)=>updateSurgeryItems(surgery.id, newItems), `${surgery.scheduled_time} · ${surgery.title}`)}
                        style={{flex:1, padding:"12px 0", borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}
                      ><Edit2 size={14}/>품목 편집</button>
                      <button
                        onClick={()=>confirmSurgeryPrep(surgery.id)}
                        style={{flex:2, padding:"12px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font}}
                      >준비 확인 완료</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 발주 대기 배너 — 매니저/원장 */}
      {canApprove && pendingCount>0 && (
        <div style={{padding:"0 16px 12px"}}>
          <button onClick={()=>setTab("admin")} style={{width:"100%", padding:"14px 16px", borderRadius:16, border:`1.5px solid ${T.orange500}44`, background:T.orange50, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:36, height:36, borderRadius:9999, background:T.orange500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><ClipboardList size={18} color={T.white}/></div>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>승인 대기 중인 발주 요청</p>
              <p style={{margin:"2px 0 0", fontSize:12, color:T.orange500, fontWeight:600}}>{pendingCount}건 검토 필요</p>
            </div>
            <ChevronRight size={18} color={T.orange500}/>
          </button>
        </div>
      )}

      {/* 입고 대기 배너 — 전 직원 (ordered 상태 있을 때) */}
      {waitingCount>0 && (
        <div style={{padding:"0 16px 12px"}}>
          <button onClick={()=>setTab("inventory")} style={{width:"100%", padding:"14px 16px", borderRadius:16, border:`1.5px solid ${T.teal500}44`, background:T.teal50, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:36, height:36, borderRadius:9999, background:T.teal500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><PackageCheck size={18} color={T.white}/></div>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>입고 확인이 필요합니다</p>
              <p style={{margin:"2px 0 0", fontSize:12, color:T.teal500, fontWeight:600}}>배송 완료된 품목 {waitingCount}건 — 재고에 등록해주세요</p>
            </div>
            <ChevronRight size={18} color={T.teal500}/>
          </button>
        </div>
      )}

      {/* 주의 품목 */}
      {alertItems.length>0 && (
        <div style={{padding:"0 16px 16px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <SecTitle>주의 필요 품목</SecTitle>
            <button onClick={()=>setTab("inventory")} style={{fontSize:13, color:T.blue500, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600, paddingBottom:10}}>전체보기</button>
          </div>
          <Card>
            {alertItems.slice(0,3).map((item,i)=>{
              const sc  = ST[getStatus(item)];
              const ao  = getActiveOrder(orders, item.id);
              return (
                <div key={item.id}>
                  <button onClick={()=>openModal("in",item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit"}}>
                    <div style={{width:36, height:36, borderRadius:10, background:sc.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><AlertTriangle size={18} color={sc.text}/></div>
                    <div style={{flex:1, textAlign:"left"}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{item.current_qty}{item.unit} / 최소 {item.min_qty}{item.unit}</p>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                      <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                      {ao&&<Chip label={ORDER_ST[ao.status].short} color={ORDER_ST[ao.status].text} bg={ORDER_ST[ao.status].bg} border={ORDER_ST[ao.status].border}/>}
                    </div>
                  </button>
                  {i<alertItems.slice(0,3).length-1&&<Divider/>}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* 내 발주 현황 */}
      {myOrders.length>0 && (
        <div style={{padding:"0 16px 16px"}}>
          <SecTitle>내 발주 현황</SecTitle>
          <Card>
            {myOrders.map((o,i)=>{
              const item = items.find(it=>it.id===o.item_id);
              const os   = ORDER_ST[o.status];
              return (
                <div key={o.id}>
                  <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
                    <div style={{width:36, height:36, borderRadius:10, background:os.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><ShoppingCart size={16} color={os.text}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{o.qty}{item?.unit} · {fmtDate(o.requested_at)}</p>
                    </div>
                    <Chip label={os.label} color={os.text} bg={os.bg} border={os.border}/>
                  </div>
                  {i<myOrders.length-1&&<Divider/>}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      <div style={{padding:"0 16px 24px"}}>
        <SecTitle>최근 입출고</SecTitle>
        <Card>
          {txs.slice(0,4).map((tx,i)=>{
            const item = items.find(it=>it.id===tx.item_id);
            return (
              <div key={tx.id}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
                  <div style={{width:36, height:36, borderRadius:10, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {tx.type==="in"?<ArrowDownToLine size={16} color={T.blue500}/>:<ArrowUpFromLine size={16} color={T.red500}/>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                    <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{tx.user} · {fmtDate(tx.created_at)}</p>
                  </div>
                  <span style={{fontSize:15, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</span>
                </div>
                {i<3&&<Divider/>}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
