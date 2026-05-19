import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ST } from "../../constants/itemStates";
import { getStatus, catColor } from "../../utils/helpers";
import { Inp } from "../shared/Inp";
import { Avatar } from "../shared/Avatar";

export function OrderRequestSheet({item, currentUser, onSubmit, onClose}) {
  const [qty,  setQty]  = useState(Math.max(1, item.min_qty - item.current_qty));
  const [note, setNote] = useState("");
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>발주 요청</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={24} color={T.grey500}/></button>
      </div>
      <div style={{background:T.teal50, borderRadius:12, padding:"16px 18px", marginBottom:20, border:`1px solid ${T.teal500}22`}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
          <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id)}}/>
          <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey900}}>{item.name}</p>
        </div>
        <p style={{margin:0, fontSize: 16, color:T.grey600}}>
          현재 재고 <span style={{fontWeight:700, color:ST[getStatus(item)].text}}>{item.current_qty}{item.unit}</span>
          <span style={{color:T.grey400}}> · 최소 {item.min_qty}{item.unit}</span>
        </p>
      </div>
      <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:600, color:T.grey700}}>요청 수량</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
        <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:52, height:52, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Minus size={22} color={T.grey700}/></button>
        <p style={{flex:1, textAlign:"center", margin:0, fontSize: 28, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{qty}</p>
        <button onClick={()=>setQty(q=>q+1)} style={{width:52, height:52, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Plus size={22} color={T.white}/></button>
      </div>
      <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:600, color:T.grey700}}>메모 <span style={{fontWeight:400, color:T.grey400}}>(선택)</span></p>
      <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 재고 급하게 필요합니다" style={{marginBottom:16}}/>
      <div style={{display:"flex", alignItems:"center", gap:8, padding:"14px 18px", background:T.grey50, borderRadius:12, marginBottom:20, border:`1px solid ${T.grey200}`}}>
        <Avatar name={currentUser.name} role={currentUser.role} size={28}/>
        <p style={{margin:0, fontSize: 16, color:T.grey600}}><span style={{fontWeight:600, color:T.grey900}}>{currentUser.name}</span> · 장바구니 확인 후 일괄 발주 요청</p>
      </div>
      <button onClick={()=>onSubmit(item,qty,note)} style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize: 16, fontWeight:600, color:T.white, background:T.blue500}}>
        장바구니에 담기
      </button>
    </div>
  );
}
