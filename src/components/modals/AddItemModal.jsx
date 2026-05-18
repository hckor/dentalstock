import { useState } from "react";
import { X } from "lucide-react";
import { T, font } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { Inp } from "../shared/Inp";

export function AddItemModal({setItems, onClose, showToast}) {
  const [name,setName]=useState(""); const [catId,setCatId]=useState(1); const [unit,setUnit]=useState("개"); const [minQty,setMinQty]=useState(5); const [loc,setLoc]=useState("");
  const submit=()=>{if(!name.trim())return;setItems(p=>[...p,{id:`i${Date.now()}`,name:name.trim(),category_id:catId,unit,current_qty:0,min_qty:minQty,location:loc}]);showToast(`${name} 품목 추가 완료`);onClose();};
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.grey900}}>품목 추가</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={20} color={T.grey500}/></button></div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="예: 라텍스 장갑 (L)" style={{marginBottom:12}}/>
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"9px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,background:catId===c.id?c.color:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)} placeholder="개/박스"/></div>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(parseInt(e.target.value)||1)} type="number"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} placeholder="예: 창고 A-1" style={{marginBottom:16}}/>
      <button onClick={submit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:font}}>추가 완료</button>
    </div>
  );
}
