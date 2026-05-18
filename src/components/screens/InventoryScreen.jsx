import { useState } from "react";
import {
  Search, Plus, Clock, Edit2, ShoppingCart, PackageCheck
} from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { CATEGORIES } from "../../constants/categories";
import { ST } from "../../constants/itemStates";
import { getStatus, catName, catColor, daysUntil, getActiveOrder } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { Chip } from "../shared/Chip";
import { AddItemModal } from "../modals/AddItemModal";
import { EditItemModal } from "../modals/EditItemModal";

export function InventoryScreen({items, search, setSearch, cat, setCat, openModal, setItems, orders, showToast}) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState(null);

  return (
    <div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{position:"relative", marginBottom:12}}>
          <div style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)"}}><Search size={16} color={T.grey400}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="품목명 검색"
            style={{width:"100%", padding:"12px 14px 12px 40px", borderRadius:12, border:`1px solid rgba(2,32,71,0.08)`, background:"rgba(0,23,51,0.02)", fontSize:15, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:12}}>
          {[{id:0,name:"전체"},...CATEGORIES].map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flexShrink:0, padding:"7px 16px", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:13, fontWeight:600, background:cat===c.id?T.blue500:T.white, color:cat===c.id?T.white:T.grey700, boxShadow:cat===c.id?"none":CS, transition:"all 150ms"}}>{c.name}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px 8px"}}>
        <button onClick={()=>setShowAdd(true)} style={{width:"100%", padding:"13px 0", borderRadius:9999, border:`1.5px dashed ${T.blue500}`, background:T.blue50, color:T.blue500, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <Plus size={16}/> 품목 추가
        </button>
      </div>

      <div style={{padding:"8px 16px 24px"}}>
        <Card>
          {items.map((item,i) => {
            const st       = getStatus(item);
            const sc       = ST[st];
            const days     = daysUntil(item.expiry);
            const ao       = getActiveOrder(orders, item.id);  // 활성 발주 정보
            const isOrdered = ao?.status === "ordered"; // 입고 대기 중

            return (
              <div key={item.id}>
                <div style={{padding:"14px 16px"}}>
                  {/* 품목명 + 상태 뱃지 행 */}
                  <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:8}}>
                    <div style={{width:6, height:6, borderRadius:9999, background:catColor(item.category_id), flexShrink:0, marginTop:6}}/>
                    <div style={{flex:1}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{catName(item.category_id)} · {item.location}</p>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0}}>
                      <button onClick={()=>setEditItem(item)} style={{border:"none", background:T.grey100, borderRadius:8, padding:6, cursor:"pointer", display:"flex", alignItems:"center"}}><Edit2 size={13} color={T.grey600}/></button>
                    </div>
                  </div>

                  {/* ★ 재고 상태 + 발주 상태 칩 라인 */}
                  <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap"}}>
                    <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                    {ao && (
                      <Chip
                        label={ORDER_ST[ao.status].label}
                        color={ORDER_ST[ao.status].text}
                        bg={ORDER_ST[ao.status].bg}
                        border={ORDER_ST[ao.status].border}
                      />
                    )}
                    {!ao && st!=="ok" && (
                      <Chip label="발주미요청" color={T.grey500} bg={T.grey100} border={T.grey200}/>
                    )}
                  </div>

                  {/* 재고 바 */}
                  <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:days&&days<=30?8:10}}>
                    <div style={{flex:1, height:4, background:T.grey100, borderRadius:9999, overflow:"hidden"}}>
                      <div style={{height:"100%", borderRadius:9999, background:st==="ok"?T.green500:st==="warning"?T.orange500:T.red500, width:`${Math.min(100,(item.current_qty/(item.min_qty*2))*100)}%`, transition:"width 250ms"}}/>
                    </div>
                    <span style={{fontSize:14, fontWeight:700, color:T.grey900, flexShrink:0, fontVariantNumeric:"tabular-nums"}}>{item.current_qty}<span style={{fontSize:11, color:T.grey400, fontWeight:400}}>{item.unit}</span></span>
                  </div>

                  {/* 유통기한 경고 */}
                  {days!==null&&days<=30&&(
                    <div style={{background:days<=7?T.red50:T.orange50, borderRadius:8, padding:"5px 10px", marginBottom:10, display:"flex", alignItems:"center", gap:6}}>
                      <Clock size={12} color={days<=7?T.red500:T.orange500}/>
                      <span style={{fontSize:12, color:days<=7?T.red500:T.orange500, fontWeight:600}}>유통기한 {days<=0?"만료":`${days}일 후 만료`} ({item.expiry})</span>
                    </div>
                  )}

                  {/* ★ 입고 대기 중일 때 → 입고 확인 강조 배너 */}
                  {isOrdered && (
                    <div style={{background:T.teal50, border:`1.5px solid ${T.teal500}44`, borderRadius:12, padding:"10px 12px", marginBottom:10}}>
                      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                        <PackageCheck size={16} color={T.teal500}/>
                        <p style={{margin:0, fontSize:13, fontWeight:700, color:T.teal500}}>배송 완료 예정 — 입고 확인 필요</p>
                      </div>
                      <p style={{margin:"0 0 8px", fontSize:12, color:T.grey600}}>
                        발주 수량 <span style={{fontWeight:700, color:T.grey900}}>{ao.qty}{item.unit}</span> · 요청자: {ao.requested_by}
                      </p>
                      <button
                        onClick={()=>openModal("confirm_receipt", item)}
                        style={{width:"100%", padding:"10px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:6}}
                      >
                        <PackageCheck size={15}/> 실 입고 확인하기
                      </button>
                    </div>
                  )}

                  {/* 기본 버튼: 입고 / 출고 / 발주요청 */}
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1.2fr", gap:6}}>
                    <button onClick={()=>openModal("in",item)} style={{padding:"9px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:font}}>입고</button>
                    <button onClick={()=>openModal("out",item)} style={{padding:"9px 0", borderRadius:9999, border:"none", background:T.red500, color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:font}}>출고</button>
                    <button
                      onClick={()=>openModal("order_req",item)}
                      disabled={!!ao}
                      style={{padding:"9px 0", borderRadius:9999, border:"none", background:ao?T.grey100:T.blue50, color:ao?T.grey400:T.blue500, fontSize:13, fontWeight:600, cursor:ao?"not-allowed":"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}
                    >
                      <ShoppingCart size={13}/> {ao?"처리중":"발주"}
                    </button>
                  </div>
                </div>
                {i<items.length-1&&<Divider/>}
              </div>
            );
          })}
        </Card>
      </div>

      {showAdd&&(
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setShowAdd(false)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}><div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/></div>
            <AddItemModal setItems={setItems} onClose={()=>setShowAdd(false)} showToast={showToast}/>
          </div>
        </div>
      )}
      {editItem&&(
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setEditItem(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}><div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/></div>
            <EditItemModal item={editItem} setItems={setItems} onClose={()=>setEditItem(null)} showToast={showToast}/>
          </div>
        </div>
      )}
    </div>
  );
}
