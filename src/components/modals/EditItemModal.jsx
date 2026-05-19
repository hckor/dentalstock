import { useState } from "react";
import { X } from "lucide-react";
import { T, font } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { Inp } from "../shared/Inp";

export function EditItemModal({item, setItems, onClose, showToast}) {
  const [name,setName]=useState(item.name); const [catId,setCatId]=useState(item.category_id); const [unit,setUnit]=useState(item.unit); const [minQty,setMinQty]=useState(item.min_qty); const [loc,setLoc]=useState(item.location||"");
  const submit=()=>{setItems(p=>p.map(i=>i.id===item.id?{...i,name,category_id:catId,unit,min_qty:minQty,location:loc}:i));showToast(`${name} 수정 완료`);onClose();};
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize:26,fontWeight:700,color:T.grey900}}>품목 수정</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={24} color={T.grey500}/></button></div>
      <p style={{margin:"0 0 6px",fontSize:19,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:12}}/>
      <p style={{margin:"0 0 8px",fontSize:19,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"14px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:18,fontWeight:600,background:catId===c.id?c.color:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize:19,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)}/></div>
        <div><p style={{margin:"0 0 6px",fontSize:19,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(parseInt(e.target.value)||1)} type="number"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize:19,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} style={{marginBottom:16}}/>
      <button onClick={submit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:19,fontWeight:600,cursor:"pointer",fontFamily:font}}>수정 완료</button>
    </div>
  );
}
