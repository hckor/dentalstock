import { ClipboardCheck, ClipboardList, PackagePlus, RotateCcw } from "lucide-react";
import { resetToInitial } from "../../../api/seed";
import { T, font, monoFont } from "../../../constants/colors";
import { Card } from "../../shared/Card";

export function ItemsAdminPanel({
  items,
  temporaryItems,
  baselineReadyCount,
  openModal,
  setShowStocktake,
  setShowInitialInventory,
}) {
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
        {[
          {label:"전체 품목", value:items.length, color:T.blue500},
          {label:"기준값 완료", value:baselineReadyCount, color:T.green500},
          {label:"정리 필요", value:temporaryItems.length, color:T.red500},
        ].map(s => (
          <Card key={s.label} style={{padding:"12px 10px"}}>
            <p style={{margin:"0 0 4px", fontSize: 16, color:T.grey500}}>{s.label}</p>
            <p style={{margin:0, fontSize: 24, fontWeight:700, color:s.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
          </Card>
        ))}
      </div>
      <button
        onClick={() => openModal("add_item")}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
        <PackagePlus size={18}/> 품목 기준값 추가
      </button>
      <button
        onClick={() => setShowStocktake(true)}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.blue500}33`, background:T.white, color:T.blue500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
        <ClipboardCheck size={18}/> 기준 수량 보정
      </button>
      <button
        onClick={() => setShowInitialInventory(true)}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.blue500}33`, background:T.blue50, color:T.blue500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
        <ClipboardList size={18}/> 초기 재고 / 기준값 일괄 입력
      </button>
      {temporaryItems.length > 0 && (
        <Card style={{padding:16, margin:"8px 0 12px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10}}>
            <div>
              <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900}}>정리 필요 품목</p>
              <p style={{margin:"2px 0 0", fontSize:13, color:T.grey500}}>카탈로그에 없는 품목은 나중에 정식 품목으로 확정해주세요.</p>
            </div>
            <span style={{flexShrink:0, borderRadius:9999, padding:"4px 9px", background:T.red50, color:T.red500, fontSize:13, fontWeight:700}}>{temporaryItems.length}건</span>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {temporaryItems.slice(0, 4).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => openModal("edit_item", item)}
                style={{width:"100%", border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontFamily:font}}>
                <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:700, color:T.grey900, overflowWrap:"anywhere", wordBreak:"keep-all"}}>{item.name}</p>
                <p style={{margin:"2px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>{item.current_qty}{item.unit} · {item.location || "위치 없음"}</p>
              </button>
            ))}
            {temporaryItems.length > 4 && <p style={{margin:0, fontSize:13, color:T.grey500}}>외 {temporaryItems.length - 4}개가 더 있어요.</p>}
          </div>
        </Card>
      )}
      <button
        onClick={()=>{
          if (window.confirm("모든 데이터를 초기 상태로 되돌립니다. 계속하시겠습니까?")) {
            resetToInitial();
            window.location.reload();
          }
        }}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.orange500}33`, background:T.orange50, color:T.orange500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
        <RotateCcw size={18}/> 초기 데이터로 리셋 (데모용)
      </button>
    </>
  );
}
