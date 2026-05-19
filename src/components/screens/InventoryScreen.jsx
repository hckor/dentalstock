import { useState, useMemo } from "react";
import {
  Search, Plus, CalendarClock, ScanLine
} from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { getStatus, getActiveOrder } from "../../utils/helpers";
import { AddItemModal } from "../modals/AddItemModal";
import { BottomSheet } from "../shared/BottomSheet";
import { ItemCard } from "../shared/ItemCard";

export function InventoryScreen({items, search, setSearch, cat, setCat, openModal, setItems, orders, showToast, onItemClick, onExpiryClick, onBarcodeClick}) {
  const [showAdd, setShowAdd] = useState(false);

  const alertItems = useMemo(() => items.filter(i => getStatus(i) !== "ok"), [items]);
  const okItems = useMemo(() => items.filter(i => getStatus(i) === "ok"), [items]);

  const renderItem = (item) => {
    const ao = getActiveOrder(orders, item.id);
    const isOrdered = ao?.status === "ordered";

    return (
      <ItemCard
        key={item.id}
        item={item}
        isOrdered={isOrdered}
        ao={ao}
        onCardClick={onItemClick}
        onOutClick={() => openModal("out", item)}
        openModal={openModal}
      />
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
              style={{width:"100%", padding:"11px 13px 11px 38px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.grey50, fontSize: 16, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}/>
          </div>
          <button onClick={onBarcodeClick} style={{flexShrink:0, width:48, height:48, borderRadius:10, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <ScanLine size={20} color={T.grey600}/>
          </button>
          <button onClick={onExpiryClick} style={{flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"10px 13px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, whiteSpace:"nowrap"}}>
            <CalendarClock size={18} color={T.grey600}/> 유통기한
          </button>
          <button onClick={()=>setShowAdd(true)} style={{flexShrink:0, width:48, height:48, borderRadius:10, border:"none", background:T.blue500, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
            <Plus size={22} color={T.white}/>
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none"}}>
          {[{id:0,name:"전체"},...CATEGORIES].map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flexShrink:0, padding:"12px 20px", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize: 16, fontWeight:600, background:cat===c.id?T.blue500:T.white, color:cat===c.id?T.white:T.grey600, boxShadow:cat===c.id?"none":CS, transition:"all 150ms"}}>
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
              <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey700}}>확인 필요 {alertItems.length}</p>
            </div>
            {alertItems.map(renderItem)}
            {okItems.length > 0 && (
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10, marginTop:6}}>
                <div style={{width:7, height:7, borderRadius:9999, background:T.green500}}/>
                <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey700}}>정상</p>
              </div>
            )}
          </>
        )}

        {/* 정상 품목 */}
        {okItems.map(renderItem)}

        {items.length === 0 && (
          <div style={{textAlign:"center", padding:"40px 0"}}>
            <p style={{margin:0, fontSize: 16, color:T.grey400}}>품목이 없어요</p>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showAdd && (
        <BottomSheet onClose={()=>setShowAdd(false)}>
          <AddItemModal setItems={setItems} onClose={()=>setShowAdd(false)} showToast={showToast}/>
        </BottomSheet>
      )}
    </div>
  );
}
