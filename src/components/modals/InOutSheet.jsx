import { X, Minus, Plus } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { Inp } from "../shared/Inp";

export function InOutSheet({modal, selItem, form, setForm, onCommit, onClose}) {
  const isOut = modal === "out";
  const accent = isOut ? T.red500 : T.blue500;
  const actionAccent = T.blue500;
  const accentSoft = isOut ? T.grey100 : T.blue50;
  const accentBorder = isOut ? T.grey200 : T.blue500+"33";
  const requestedQty = Math.max(1, parseInt(form.qty) || 1);
  const overStock = isOut && requestedQty > selItem.current_qty;

  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize: 22, lineHeight:"30px", fontWeight:700, color:accent}}>{isOut?"출고 등록":"입고 등록"}</h2>
        <button aria-label="닫기" onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={24} color={T.grey500}/></button>
      </div>
      <div style={{background:T.grey50, borderRadius:12, padding:"16px 18px", marginBottom:20, border:`1.5px solid ${accentBorder}`}}>
        <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{selItem.name}</p>
        <p style={{margin:"4px 0 0", fontSize: 16, color:T.grey600}}>현재 재고 <span style={{fontWeight:700, color:accent}}>{selItem.current_qty}{selItem.unit}</span></p>
      </div>
      <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:600, color:T.grey700}}>수량</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:12}}>
        <button onClick={()=>setForm(f=>({...f,qty:Math.max(1,f.qty-1)}))} style={{width:44,height:44,borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={22} color={T.grey700}/></button>
        <p style={{flex:1,textAlign:"center",margin:0,fontSize: 30,fontWeight:700,color:T.grey900,fontFamily:monoFont,fontVariantNumeric:"tabular-nums"}}>{form.qty}</p>
        <button onClick={()=>setForm(f=>({...f,qty:f.qty+1}))} style={{width:44,height:44,borderRadius:9999,border:"none",background:actionAccent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={22} color={T.white}/></button>
      </div>
      <div style={{display:"flex", gap:6, marginBottom:20}}>
        {[10, 50, 100].map(n => (
          <button key={n} onClick={()=>setForm(f=>({...f,qty:f.qty+n}))} style={{flex:1, padding:"14px 0", borderRadius:9999, border:`1px solid ${accentBorder}`, background:accentSoft, color:accent, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>
            +{n}
          </button>
        ))}
      </div>
      {overStock && (
        <p style={{margin:"-10px 0 16px", fontSize: 16, color:T.red500, fontWeight:600, textAlign:"center"}}>
          현재 재고는 {selItem.current_qty}{selItem.unit}입니다
        </p>
      )}
      <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:600, color:T.grey700}}>메모 (선택)</p>
      <Inp value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="예: 진료실 보충" style={{marginBottom:20}}/>
      <button
        onClick={onCommit}
        disabled={overStock}
        style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",cursor:overStock?"not-allowed":"pointer",fontFamily:font,fontSize: 16,fontWeight:600,color:T.white,background:overStock?T.grey300:actionAccent}}
      >
        {overStock ? "재고 부족" : isOut ? "출고 완료" : "입고 완료"}
      </button>
    </div>
  );
}
