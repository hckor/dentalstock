import { useState } from "react";
import { X, Minus, Plus, CircleDot } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { Inp } from "../shared/Inp";

export function ReceiptConfirmSheet({item, orders, onConfirm, onClose}) {
  const order = orders.find(o=>o.item_id===item.id&&o.status==="ordered");
  const [qty,  setQty]  = useState(order?.qty || 1);
  const [note, setNote] = useState("");
  if (!order) return null;
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>실 입고 확인</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={24} color={T.grey500}/></button>
      </div>

      {/* 발주 정보 */}
      <div style={{background:T.teal50, borderRadius:12, padding:"16px 18px", marginBottom:20, border:`1px solid ${T.teal500}33`}}>
        <p style={{margin:0, fontSize: 16, color:T.grey600, marginBottom:4}}>발주 정보</p>
        <p style={{margin:0, fontSize: 20, fontWeight:700, color:T.grey900}}>{item.name}</p>
        <div style={{display:"flex", gap:12, marginTop:6}}>
          <span style={{fontSize: 16, color:T.grey600}}>발주 수량 <span style={{fontWeight:700, color:T.teal500}}>{order.qty}{item.unit}</span></span>
          <span style={{fontSize: 16, color:T.grey600}}>요청자 <span style={{fontWeight:600, color:T.grey800}}>{order.requested_by}</span></span>
        </div>
      </div>

      {/* 실 수령 수량 — 발주량과 다를 수 있음 */}
      <p style={{margin:"0 0 6px", fontSize: 16, fontWeight:600, color:T.grey700}}>실제 수령한 수량</p>
      <p style={{margin:"0 0 10px", fontSize: 16, color:T.grey500}}>실제로 받은 수량을 확인 후 입력해주세요</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
        <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:52, height:52, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <Minus size={22} color={T.grey700}/>
        </button>
        <div style={{flex:1, textAlign:"center"}}>
          <p style={{margin:0, fontSize: 30, fontWeight:700, color:T.grey900, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{qty}</p>
          {qty !== order.qty && <p style={{margin:"2px 0 0", fontSize: 16, color:T.orange500, fontWeight:600}}>발주량({order.qty})과 다릅니다</p>}
        </div>
        <button onClick={()=>setQty(q=>q+1)} style={{width:52, height:52, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <Plus size={22} color={T.white}/>
        </button>
      </div>
      <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:600, color:T.grey700}}>특이사항 (선택)</p>
      <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 1박스 파손, 일부 수령" style={{marginBottom:20}}/>
      <div style={{background:T.grey50, borderRadius:10, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:8}}>
        <CircleDot size={18} color={T.green500}/>
        <p style={{margin:0, fontSize: 16, color:T.grey600}}>확인 완료 시 <span style={{fontWeight:700, color:T.grey900}}>{item.current_qty} + {qty} = {item.current_qty+qty}{item.unit}</span>으로 재고가 업데이트됩니다</p>
      </div>
      <button onClick={()=>onConfirm(order.id, qty, note)} style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>
        입고 확인 완료
      </button>
    </div>
  );
}
