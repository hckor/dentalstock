import { useMemo } from "react";
import { Search, CalendarClock } from "lucide-react";
import { T, font } from "../../constants/colors";
import { getStatus, getActiveOrder } from "../../utils/helpers";
import { ItemCard } from "../shared/ItemCard";

export function InventoryScreen({items, search, setSearch, orders, onItemClick, onExpiryClick}) {
  const alertItems = useMemo(() => items.filter(i => getStatus(i) !== "ok"), [items]);
  const okItems    = useMemo(() => items.filter(i => getStatus(i) === "ok"),  [items]);

  const renderItem = (item) => {
    const ao = getActiveOrder(orders, item.id);
    return (
      <ItemCard
        key={item.id}
        item={item}
        isOrdered={ao?.status === "ordered"}
        ao={ao}
        onCardClick={onItemClick}
      />
    );
  };

  return (
    <div>
      {/* 검색 + 유통기한 */}
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex", gap:8, marginBottom:16, alignItems:"center"}}>
          <div style={{position:"relative", flex:1}}>
            <div style={{position:"absolute", left:13, top:"50%", transform:"translateY(-50%)"}}><Search size={18} color={T.grey400}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="품목명 검색"
              style={{width:"100%", padding:"11px 13px 11px 38px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.grey50, fontSize:16, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}/>
          </div>
          <button onClick={onExpiryClick} style={{flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"11px 14px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:font, whiteSpace:"nowrap"}}>
            <CalendarClock size={18} color={T.grey600}/> 유통기한
          </button>
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
