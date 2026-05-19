import { X, Minus, Plus } from "lucide-react";
import { T, font } from "../../constants/colors";
import { Inp } from "../shared/Inp";

export function InOutSheet({modal, selItem, form, setForm, onCommit, onClose}) {
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:modal==="in"?T.blue500:T.red500}}>{modal==="in"?"입고 등록":"출고 등록"}</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      <div style={{background:T.grey50, borderRadius:12, padding:"16px 16px", marginBottom:20, border:`1.5px solid ${modal==="in"?T.blue500+"33":T.red500+"33"}`}}>
        <p style={{margin:0, fontSize:16, fontWeight:600, color:T.grey900}}>{selItem.name}</p>
        <p style={{margin:"4px 0 0", fontSize:14, color:T.grey600}}>현재 재고 <span style={{fontWeight:700, color:modal==="in"?T.blue500:T.red500}}>{selItem.current_qty}{selItem.unit}</span></p>
      </div>
      <p style={{margin:"0 0 8px", fontSize:14, fontWeight:600, color:T.grey700}}>수량</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:12}}>
        <button onClick={()=>setForm(f=>({...f,qty:Math.max(1,f.qty-1)}))} style={{width:44,height:44,borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={20} color={T.grey700}/></button>
        <p style={{flex:1,textAlign:"center",margin:0,fontSize:32,fontWeight:700,color:T.grey900,fontVariantNumeric:"tabular-nums"}}>{form.qty}</p>
        <button onClick={()=>setForm(f=>({...f,qty:f.qty+1}))} style={{width:44,height:44,borderRadius:9999,border:"none",background:T.blue500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={20} color={T.white}/></button>
      </div>
      <div style={{display:"flex", gap:6, marginBottom:20}}>
        {[10, 50, 100].map(n => (
          <button key={n} onClick={()=>setForm(f=>({...f,qty:f.qty+n}))} style={{flex:1, padding:"8px 0", borderRadius:9999, border:`1px solid #bfdbfe`, background:T.blue50, color:T.blue500, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font}}>
            +{n}
          </button>
        ))}
      </div>
      <p style={{margin:"0 0 8px", fontSize:14, fontWeight:600, color:T.grey700}}>메모 (선택)</p>
      <Inp value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="예: 진료실 보충" style={{marginBottom:20}}/>
      <button onClick={onCommit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:16,fontWeight:600,color:T.white,background:modal==="out"?T.red500:T.blue500}}>
        {modal==="in"?"입고 완료":"출고 완료"}
      </button>
    </div>
  );
}
