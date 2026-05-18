import { useState, useMemo } from "react";
import { ShoppingCart, Truck, XCircle, PackageCheck, LogOut, RotateCcw } from "lucide-react";
import { resetToInitial } from "../../../api/seed";
import { T, font } from "../../../constants/colors";
import { ROLE_META } from "../../../constants/permissions";
import { ORDER_ST } from "../../../constants/orderStates";
import { ST } from "../../../constants/itemStates";
import { getStatus, fmtFull } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Avatar } from "../../shared/Avatar";
import { SecTitle } from "../../shared/SecTitle";
import { Inp } from "../../shared/Inp";
import { AnalyticsTab } from "./AnalyticsTab";
import { SurgeryAdminTab } from "./SurgeryAdminTab";

export function AdminScreen({users, setUsers, currentUser, orders, items, txs, surgeries, addSurgery, onLogout, approveOrder, rejectOrder, openItemsEditor, updateSurgeryItems}) {
  const [adminTab,     setAdminTab]     = useState("orders");
  const [reviewModal,  setReviewModal]  = useState(null);
  const [reviewNote,   setReviewNote]   = useState("");

  const pendingOrders = useMemo(() => orders.filter(o => o.status === "pending"), [orders]);
  const doneOrders    = useMemo(() => orders.filter(o => o.status !== "pending"), [orders]);

  const confirmReview = () => {
    if (!reviewModal) return;
    reviewModal.action==="approved" ? approveOrder(reviewModal.order.id, reviewNote) : rejectOrder(reviewModal.order.id, reviewNote);
    setReviewModal(null); setReviewNote("");
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column"}}>
      {/* 서브탭 */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.grey100}`,padding:"12px 16px"}}>
        <div style={{display:"flex",gap:4,background:T.grey100,borderRadius:12,padding:4}}>
        {[{id:"orders",label:"발주 승인",badge:pendingOrders.length},{id:"surgery",label:"수술 준비"},{id:"analytics",label:"소비 분석"},{id:"staff",label:"직원 관리"}].map(t=>(
          <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:10,background:adminTab===t.id?T.white:"transparent",boxShadow:adminTab===t.id?"0px 2px 4px rgba(0,0,0,0.06)":"none",cursor:"pointer",fontFamily:font,fontSize:13,fontWeight:adminTab===t.id?700:600,color:adminTab===t.id?T.grey900:T.grey500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {t.label}{t.badge>0&&<span style={{background:T.red500,color:T.white,borderRadius:9999,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{t.badge}</span>}
          </button>
        ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",background:T.grey50,padding:16}}>

        {adminTab==="orders"&&(
          <>
            {pendingOrders.length>0?(
              <>
                <SecTitle>승인 대기 ({pendingOrders.length}건)</SecTitle>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {pendingOrders.map(order=>{
                    const item=items.find(i=>i.id===order.item_id);
                    const st=getStatus(item||{current_qty:0,min_qty:1});
                    return (
                      <Card key={order.id} style={{padding:"14px 16px",border:`1.5px solid ${T.orange500}33`}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12}}>
                          <div style={{width:36,height:36,borderRadius:10,background:T.orange50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><ShoppingCart size={16} color={T.orange500}/></div>
                          <div style={{flex:1}}>
                            <p style={{margin:0,fontSize:14,fontWeight:700,color:T.grey900}}>{item?.name}</p>
                            <p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>요청: <span style={{fontWeight:600,color:T.grey800}}>{order.requested_by}</span> · {fmtFull(order.requested_at)}</p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}><p style={{margin:0,fontSize:18,fontWeight:700,color:T.orange500,fontVariantNumeric:"tabular-nums"}}>{order.qty}<span style={{fontSize:12,fontWeight:400,color:T.grey500}}>{item?.unit}</span></p></div>
                        </div>
                        <div style={{background:T.grey50,borderRadius:8,padding:"8px 10px",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:6,height:6,borderRadius:9999,background:ST[st].text,flexShrink:0}}/>
                          <span style={{fontSize:12,color:T.grey600}}>현재 재고 <span style={{fontWeight:600,color:ST[st].text}}>{item?.current_qty}{item?.unit}</span><span style={{color:T.grey400}}> · 최소 {item?.min_qty}{item?.unit}</span></span>
                        </div>
                        {order.note&&<div style={{background:T.orange50,borderRadius:8,padding:"8px 10px",marginBottom:12}}><p style={{margin:0,fontSize:12,color:T.orange500}}>"{order.note}"</p></div>}
                        <p style={{margin:"0 0 8px",fontSize:12,color:T.grey500}}>승인 시 발주 완료 상태로 변경 → 직원이 실 입고 확인 후 재고 반영</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <button onClick={()=>{setReviewModal({order,action:"rejected"});setReviewNote("");}} style={{padding:"11px 0",borderRadius:9999,border:`1.5px solid ${T.red500}`,background:T.red50,color:T.red500,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><XCircle size={15}/> 거절</button>
                          <button onClick={()=>{setReviewModal({order,action:"approved"});setReviewNote("");}} style={{padding:"11px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Truck size={15}/> 발주 승인</button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <p style={{margin:0,fontSize:16,fontWeight:600,color:T.grey900}}>검토할 발주 요청이 없어요.</p>
                <p style={{margin:"6px 0 0",fontSize:13,color:T.grey500}}>새 요청이 들어오면 이곳에서 승인할 수 있어요.</p>
              </div>
            )}
            {doneOrders.length>0&&(
              <>
                <SecTitle>처리 이력</SecTitle>
                <Card>
                  {doneOrders.map((o,i)=>{
                    const item=items.find(it=>it.id===o.item_id); const os=ORDER_ST[o.status];
                    return (
                      <div key={o.id}>
                        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",opacity:0.85}}>
                          <div style={{width:32,height:32,borderRadius:8,background:os.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {o.status==="ordered"?<Truck size={14} color={os.text}/>:o.status==="received"?<PackageCheck size={14} color={os.text}/>:<XCircle size={14} color={os.text}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:0,fontSize:13,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name}</p>
                            <p style={{margin:"1px 0 0",fontSize:11,color:T.grey500}}>{o.requested_by} 요청 · {o.reviewed_by} 처리</p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}><Chip label={os.label} color={os.text} bg={os.bg} border={os.border}/><p style={{margin:"4px 0 0",fontSize:11,color:T.grey400}}>{o.qty}{item?.unit}</p></div>
                        </div>
                        {i<doneOrders.length-1&&<Divider/>}
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}

        {adminTab==="analytics"&&(
          <AnalyticsTab items={items} txs={txs} orders={orders}/>
        )}

        {adminTab==="surgery"&&(
          <SurgeryAdminTab items={items} surgeries={surgeries} addSurgery={addSurgery} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>
        )}

        {adminTab==="staff"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
              {[{label:"총 입출고",value:txs.length,color:T.blue500},{label:"승인 대기",value:orders.filter(o=>o.status==="pending").length,color:T.orange500},{label:"입고 대기",value:orders.filter(o=>o.status==="ordered").length,color:T.teal500}].map(s=>(
                <Card key={s.label} style={{padding:"12px 10px"}}><p style={{margin:"0 0 4px",fontSize:11,color:T.grey500}}>{s.label}</p><p style={{margin:0,fontSize:22,fontWeight:700,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</p></Card>
              ))}
            </div>
            <SecTitle>직원 목록</SecTitle>
            <Card style={{marginBottom:16}}>
              {users.map((u,i)=>{const m=ROLE_META[u.role]; const isMe=u.id===currentUser.id;return(
                <div key={u.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",opacity:u.active?1:0.45}}>
                    <Avatar name={u.name} role={u.role} size={40}/>
                    <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900}}>{u.name}</p>{isMe&&<span style={{fontSize:10,fontWeight:700,color:T.blue500,background:T.blue50,padding:"1px 6px",borderRadius:9999}}>나</span>}</div><span style={{fontSize:12,fontWeight:600,color:m.color}}>{m.label}</span></div>
                    {!isMe&&<button onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x))} style={{padding:"5px 12px",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,background:u.active?T.red50:T.green50,color:u.active?T.red500:T.green500}}>{u.active?"비활성":"활성화"}</button>}
                  </div>
                  {i<users.length-1&&<Divider/>}
                </div>
              );})}
            </Card>
            <button
              onClick={()=>{
                if (window.confirm("모든 데이터를 초기 상태로 되돌립니다. 계속하시겠습니까?")) {
                  resetToInitial();
                  window.location.reload();
                }
              }}
              style={{width:"100%",padding:"14px 0",borderRadius:9999,border:`1.5px solid ${T.orange500}33`,background:T.orange50,color:T.orange500,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
              <RotateCcw size={15}/> 초기 데이터로 리셋 (데모용)
            </button>
            <button onClick={onLogout} style={{width:"100%",padding:"14px 0",borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,color:T.grey700,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <LogOut size={16} color={T.grey600}/> 로그아웃
            </button>
          </>
        )}
      </div>

      {/* 승인/거절 확인 모달 */}
      {reviewModal&&(
        <div style={{position:"absolute",inset:0,background:"rgba(2,9,19,0.5)",zIndex:99,display:"flex",justifyContent:"center",alignItems:"flex-end"}} onClick={()=>setReviewModal(null)}>
          <div style={{background:T.white,borderRadius:"16px 16px 0 0",width:"100%",padding:"20px 20px 40px",boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><div style={{width:36,height:4,borderRadius:9999,background:T.grey200}}/></div>
            <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:700,color:T.grey900}}>{reviewModal.action==="approved"?"발주 승인":"발주 거절"}</h2>
            <p style={{margin:"0 0 16px",fontSize:14,color:T.grey600}}>{reviewModal.action==="approved"?"승인 시 직원이 실 수령 후 직접 입고 확인합니다.":"거절 사유를 입력하면 요청자에게 알림이 전송됩니다."}</p>
            {(()=>{const item=items.find(i=>i.id===reviewModal.order.item_id);return(
              <div style={{background:T.grey50,borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${T.grey200}`}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900}}>{item?.name}</p>
                <p style={{margin:"4px 0 0",fontSize:13,color:T.grey600}}>{reviewModal.order.requested_by} · <span style={{fontWeight:700,color:T.teal500}}>{reviewModal.order.qty}{item?.unit}</span></p>
              </div>
            );})()}
            <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>{reviewModal.action==="approved"?"메모 (선택)":"거절 사유 (선택)"}</p>
            <Inp value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder={reviewModal.action==="approved"?"예: 승인합니다":"예: 이번달 예산 초과"} style={{marginBottom:20}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setReviewModal(null)} style={{padding:"14px 0",borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,color:T.grey700,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>취소</button>
              <button onClick={confirmReview} style={{padding:"14px 0",borderRadius:9999,border:"none",background:reviewModal.action==="approved"?T.blue500:T.red500,color:T.white,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>
                {reviewModal.action==="approved"?"발주 승인":"거절"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
