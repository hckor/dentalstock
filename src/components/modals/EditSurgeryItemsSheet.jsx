import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { T, font } from "../../constants/colors";
import { catColor } from "../../utils/helpers";
import { Divider } from "../shared/Divider";

export function EditSurgeryItemsSheet({initialItems, allItems, onSave, onClose, title}) {
  const [draft, setDraft] = useState(initialItems.map(r=>({item_id:r.item_id, qty:r.qty})));
  const [picking, setPicking] = useState(false);
  const selectedIds = new Set(draft.map(r=>r.item_id));
  const candidates  = allItems.filter(i=>!selectedIds.has(i.id));

  const updateQty = (item_id, qty) =>
    setDraft(p=>p.map(r=>r.item_id===item_id?{...r, qty:Math.max(1, parseInt(qty)||1)}:r));
  const removeRow = (item_id) =>
    setDraft(p=>p.filter(r=>r.item_id!==item_id));
  const addRow = (item_id) => {
    setDraft(p=>[...p, {item_id, qty:1}]);
    setPicking(false);
  };

  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>준비 품목 편집</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      {title && <p style={{margin:"0 0 14px", fontSize:13, color:T.grey500}}>{title}</p>}

      {!picking && (
        <>
          <div style={{background:T.grey50, borderRadius:12, padding:"8px 4px", marginBottom:12}}>
            {draft.length===0 ? (
              <p style={{margin:0, padding:"18px 12px", fontSize:13, color:T.grey500, textAlign:"center"}}>품목이 비어 있어요. 아래에서 추가하세요.</p>
            ) : draft.map((r,i)=>{
              const item = allItems.find(it=>it.id===r.item_id);
              const enough = item && item.current_qty>=r.qty;
              return (
                <div key={r.item_id} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</p>
                    <p style={{margin:"2px 0 0", fontSize:11, color:enough?T.grey500:T.red500}}>현재 {item?.current_qty??0}{item?.unit||""} {!enough&&item?"· 부족":""}</p>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <button onClick={()=>updateQty(r.item_id, r.qty-1)} style={{width:28, height:28, borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Minus size={14} color={T.grey700}/></button>
                    <input value={r.qty} onChange={e=>updateQty(r.item_id, e.target.value)} type="number" min={1}
                      style={{width:44, textAlign:"center", padding:"6px 0", borderRadius:8, border:`1px solid ${T.grey200}`, background:T.white, fontSize:14, fontWeight:700, color:T.grey900, fontFamily:font, outline:"none"}}/>
                    <button onClick={()=>updateQty(r.item_id, r.qty+1)} style={{width:28, height:28, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Plus size={14} color={T.white}/></button>
                  </div>
                  <span style={{fontSize:11, color:T.grey400, width:24, textAlign:"right"}}>{item?.unit||""}</span>
                  <button onClick={()=>removeRow(r.item_id)} style={{border:"none", background:"none", cursor:"pointer", padding:4}}><X size={16} color={T.grey400}/></button>
                </div>
              );
            })}
          </div>
          <button onClick={()=>setPicking(true)} disabled={candidates.length===0}
            style={{width:"100%", padding:"12px 0", borderRadius:12, border:`1.5px dashed ${T.grey300}`, background:T.white, cursor:candidates.length===0?"default":"pointer", fontFamily:font, fontSize:14, fontWeight:600, color:candidates.length===0?T.grey400:T.blue500, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            <Plus size={16}/> 품목 추가
          </button>
          <div style={{display:"flex", gap:10, paddingBottom:8}}>
            <button onClick={onClose} style={{flex:1, padding:"14px 0", borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", fontFamily:font, fontSize:15, fontWeight:600, color:T.grey700}}>취소</button>
            <button onClick={()=>{onSave(draft); onClose();}} style={{flex:2, padding:"14px 0", borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", fontFamily:font, fontSize:15, fontWeight:600, color:T.white}}>저장</button>
          </div>
        </>
      )}

      {picking && (
        <>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey700}}>추가할 품목 선택</p>
            <button onClick={()=>setPicking(false)} style={{border:"none", background:"none", cursor:"pointer", fontSize:13, color:T.grey500, fontFamily:font}}>← 뒤로</button>
          </div>
          {candidates.length===0 ? (
            <p style={{margin:0, padding:"24px 0", fontSize:13, color:T.grey500, textAlign:"center"}}>모든 품목이 이미 추가되어 있어요.</p>
          ) : candidates.map((item,i)=>(
            <div key={item.id}>
              <button onClick={()=>addRow(item.id)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 0", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
                <div style={{flex:1, textAlign:"left"}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                  <p style={{margin:0, fontSize:12, color:T.grey500}}>현재 {item.current_qty}{item.unit}</p>
                </div>
                <Plus size={16} color={T.blue500}/>
              </button>
              {i<candidates.length-1&&<Divider/>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
