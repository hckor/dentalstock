import { useState, useMemo } from "react";
import {
  Search, Plus, Clock, MoreHorizontal, ChevronRight, CalendarClock, ScanLine
} from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { getStatus, catName, daysUntil, getActiveOrder } from "../../utils/helpers";
import { AddItemModal } from "../modals/AddItemModal";
import { EditItemModal } from "../modals/EditItemModal";
import { BottomSheet } from "../shared/BottomSheet";

export function InventoryScreen({items, search, setSearch, cat, setCat, openModal, setItems, orders, showToast, onItemClick, onExpiryClick, onBarcodeClick}) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState(null);

  const alertItems = useMemo(() => items.filter(i => getStatus(i) !== "ok"), [items]);
  const okItems    = useMemo(() => items.filter(i => getStatus(i) === "ok"),  [items]);

  const renderItem = (item) => {
    const st        = getStatus(item);
    const days      = daysUntil(item.expiry);
    const ao        = getActiveOrder(orders, item.id);
    const isOrdered = ao?.status === "ordered";

    const recQty = item.min_qty * 2;

    return (
      <div key={item.id} style={{background:T.white, borderRadius:16, boxShadow:CS, marginBottom:10, overflow:"hidden", cursor:"pointer"}} onClick={()=>onItemClick && onItemClick(item)}>

        {/* 메인 영역 */}
        <div style={{padding:"16px 16px 14px"}}>

          {/* 헤더: 점 + 품목명 + 상태칩 + ... */}
          <div style={{display:"flex", alignItems:"flex-start", gap:8, marginBottom:12}}>
            <div style={{width:9, height:9, borderRadius:9999, background:st==="ok"?T.green500:T.red500, flexShrink:0, marginTop:4}}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <p style={{margin:0, fontSize:22, fontWeight:700, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                {isOrdered && (
                  <span style={{flexShrink:0, fontSize:16, fontWeight:600, color:T.blue500, background:"#dbeafe", padding:"2px 9px", borderRadius:9999}}>입고대기</span>
                )}
                {!ao && st !== "ok" && (
                  <span style={{flexShrink:0, fontSize:16, fontWeight:600, color:T.red500, background:T.red50, padding:"2px 9px", borderRadius:9999}}>발주 필요</span>
                )}
              </div>
              <p style={{margin:"3px 0 0", fontSize:18, color:T.grey400}}>{catName(item.category_id)} · {item.location}</p>
            </div>
            <button onClick={e=>{e.stopPropagation(); setEditItem(item);}} style={{border:"none", background:"none", cursor:"pointer", padding:"2px 2px", flexShrink:0, marginTop:1}}>
              <MoreHorizontal size={22} color={T.grey400}/>
            </button>
          </div>

          {/* 재고 바 + 수량 */}
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{flex:1, height:5, background:"#f1f5f9", borderRadius:9999, overflow:"hidden"}}>
              <div style={{height:"100%", borderRadius:9999, background:st==="ok"?T.green500:T.red500, width:`${Math.min(100,(item.current_qty/Math.max(recQty,1))*100)}%`, transition:"width 300ms"}}/>
            </div>
            <span style={{flexShrink:0, fontSize:20, fontWeight:700, color:T.grey800, fontVariantNumeric:"tabular-nums"}}>
              {item.current_qty}<span style={{fontSize:18, fontWeight:400, color:T.grey400}}> / {recQty}{item.unit}</span>
            </span>
          </div>

          {/* 유통기한 경고 */}
          {days !== null && days <= 30 && (
            <div style={{background:days<=7?T.red50:T.orange50, borderRadius:10, padding:"12px 16px", marginTop:10, display:"flex", alignItems:"center", gap:6}}>
              <Clock size={16} color={days<=7?T.red500:T.orange500}/>
              <span style={{fontSize:18, color:days<=7?T.red500:T.orange500, fontWeight:600}}>
                유통기한 {days<=0?"만료":`${days}일 후 만료`} ({item.expiry})
              </span>
            </div>
          )}

          {/* 배송 도착 배너 — 배경 카드 */}
          {isOrdered && (
            <div style={{background:"#f0f4ff", borderRadius:12, padding:"16px 18px", marginTop:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
              <div style={{minWidth:0}}>
                <p style={{margin:0, fontSize:20, fontWeight:700, color:T.grey900}}>배송 도착</p>
                <p style={{margin:"2px 0 0", fontSize:18, color:T.grey500}}>{ao.qty}{item.unit} · 요청자 {ao.requested_by}</p>
              </div>
              <button onClick={e=>{e.stopPropagation(); openModal("confirm_receipt",item);}} style={{flexShrink:0, padding:"10px 18px", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:19, fontWeight:700, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap"}}>
                입고 확인 <ChevronRight size={18}/>
              </button>
            </div>
          )}

          {/* 재고 부족 배너 — 배경 카드 */}
          {!ao && st !== "ok" && (
            <div style={{background:"#fff5f5", borderRadius:12, padding:"16px 18px", marginTop:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
              <div style={{minWidth:0}}>
                <p style={{margin:0, fontSize:20, fontWeight:700, color:T.grey900}}>발주 필요</p>
                <p style={{margin:"2px 0 0", fontSize:18, color:T.grey500}}>추천 {recQty}{item.unit} · 최근 30일 평균 기준</p>
              </div>
              <button onClick={e=>{e.stopPropagation(); openModal("order_req",item);}} style={{flexShrink:0, padding:"10px 18px", borderRadius:9999, border:"none", background:T.red500, color:T.white, fontSize:19, fontWeight:700, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap"}}>
                발주 <ChevronRight size={18}/>
              </button>
            </div>
          )}
        </div>

        {/* 하단 버튼 — 구분선 + 내부 둥근 버튼 */}
        <div style={{borderTop:`1px solid #f1f5f9`, padding:"10px 12px 12px", display:"flex", gap:8}}>
          <button onClick={e=>{e.stopPropagation(); openModal("in",item);}} style={{flex:1, padding:"16px 0", borderRadius:10, border:"none", background:"#eef4ff", color:T.blue500, fontSize:19, fontWeight:600, cursor:"pointer", fontFamily:font}}>
            입고
          </button>
          <button onClick={e=>{e.stopPropagation(); openModal("out",item);}} style={{flex:1, padding:"16px 0", borderRadius:10, border:"none", background:"#fff0f0", color:T.red500, fontSize:19, fontWeight:600, cursor:"pointer", fontFamily:font}}>
            출고
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 검색 + 유틸 버튼 */}
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex", gap:8, marginBottom:10, alignItems:"center"}}>
          <div style={{position:"relative", flex:1}}>
            <div style={{position:"absolute", left:13, top:"50%", transform:"translateY(-50%)"}}><Search size={18} color={T.grey400}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="품목명 검색"
              style={{width:"100%", padding:"11px 13px 11px 38px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.grey50, fontSize:20, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}/>
          </div>
          <button onClick={onBarcodeClick} style={{flexShrink:0, width:48, height:48, borderRadius:10, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <ScanLine size={20} color={T.grey600}/>
          </button>
          <button onClick={onExpiryClick} style={{flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"10px 13px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize:19, fontWeight:600, cursor:"pointer", fontFamily:font, whiteSpace:"nowrap"}}>
            <CalendarClock size={18} color={T.grey600}/> 유통기한
          </button>
          <button onClick={()=>setShowAdd(true)} style={{flexShrink:0, width:48, height:48, borderRadius:10, border:"none", background:T.blue500, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <Plus size={22} color={T.white}/>
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none"}}>
          {[{id:0,name:"전체"},...CATEGORIES].map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flexShrink:0, padding:"12px 20px", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:19, fontWeight:600, background:cat===c.id?T.blue500:T.white, color:cat===c.id?T.white:T.grey600, boxShadow:cat===c.id?"none":CS, transition:"all 150ms"}}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"4px 16px 24px"}}>
        {/* 확인 필요 섹션 */}
        {alertItems.length > 0 && (
          <>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10}}>
              <div style={{width:7, height:7, borderRadius:9999, background:T.red500}}/>
              <p style={{margin:0, fontSize:19, fontWeight:700, color:T.grey700}}>확인 필요 {alertItems.length}</p>
            </div>
            {alertItems.map(renderItem)}
            {okItems.length > 0 && (
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10, marginTop:6}}>
                <div style={{width:7, height:7, borderRadius:9999, background:T.green500}}/>
                <p style={{margin:0, fontSize:19, fontWeight:700, color:T.grey700}}>정상</p>
              </div>
            )}
          </>
        )}

        {/* 정상 품목 */}
        {okItems.map(renderItem)}

        {items.length === 0 && (
          <div style={{textAlign:"center", padding:"40px 0"}}>
            <p style={{margin:0, fontSize:20, color:T.grey400}}>품목이 없어요</p>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showAdd && (
        <BottomSheet onClose={()=>setShowAdd(false)}>
          <AddItemModal setItems={setItems} onClose={()=>setShowAdd(false)} showToast={showToast}/>
        </BottomSheet>
      )}
      {editItem && (
        <BottomSheet onClose={()=>setEditItem(null)}>
          <EditItemModal item={editItem} setItems={setItems} onClose={()=>setEditItem(null)} showToast={showToast}/>
        </BottomSheet>
      )}
    </div>
  );
}
