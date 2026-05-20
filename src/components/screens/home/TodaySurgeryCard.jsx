import { CalendarDays, ClipboardCheck, Edit2 } from "lucide-react";
import { T, font, CS } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

export function TodaySurgeryCard({ surgery, items, confirmSurgeryPrep, openItemsEditor, updateSurgeryItems }) {
  const typeLabel = surgery.type && SURGERY_PRESETS[surgery.type]?.label;
  const reqItems = surgery.required_items.map(req => {
    const item = items.find(i => i.id === req.item_id);
    const ok = item && item.current_qty >= req.qty;
    return { req, item, ok };
  });
  const allOk    = reqItems.every(r => r.ok);
  const shortage = reqItems.filter(r => !r.ok).length;

  const openEditor = () => openItemsEditor(
    surgery.required_items,
    (newItems) => updateSurgeryItems(surgery.id, newItems),
    `${surgery.scheduled_time} · ${surgery.title}`
  );

  return (
    <div style={{background:T.white, borderRadius:12, boxShadow:CS, marginBottom:10, overflow:"hidden"}}>
      <div style={{padding:"16px 16px 12px"}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:12, marginBottom:12}}>
          <div style={{width:52, height:52, borderRadius:12, background:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            {surgery.prep_confirmed
              ? <ClipboardCheck size={24} color={T.green500}/>
              : <CalendarDays size={24} color={T.blue500}/>
            }
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
              <p style={{margin:0, fontSize: 20, lineHeight:"26px", fontWeight:700, color:T.grey900, flex:"1 1 180px", minWidth:0, overflowWrap:"break-word", wordBreak:"keep-all"}}>{surgery.title}</p>
              {typeLabel && (
                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700, color:T.blue500, background:T.blue50, padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  {typeLabel}
                </span>
              )}
              {!surgery.prep_confirmed && (
                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700,
                  color: allOk ? T.green500 : T.orange500,
                  background: allOk ? T.green50 : T.orange50,
                  padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  {allOk ? "준비 완료" : `부족 ${shortage}종`}
                </span>
              )}
              {surgery.prep_confirmed && (
                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700, color:T.green500, background:T.green50, padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  확인 완료
                </span>
              )}
            </div>
            <p style={{margin:"3px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
              {surgery.scheduled_time} · 환자 {surgery.patient}
            </p>
          </div>
        </div>

        <div style={{background:T.grey50, borderRadius:12, overflow:"hidden"}}>
          {reqItems.map(({req, item, ok}, i) => (
            <div key={req.item_id}>
              <div style={{display:"flex", alignItems:"flex-start", padding:"11px 14px", gap:10}}>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize: 16, lineHeight:"22px", fontWeight:600, color:T.grey900, ...twoLineText}}>
                    {item?.name || "알 수 없는 품목"}
                  </p>
                  <p style={{margin:"2px 0 0", fontSize: 16, color:T.grey500}}>
                    필요 {req.qty}{item?.unit || "개"} · 현재 {item?.current_qty ?? 0}{item?.unit || "개"}
                  </p>
                </div>
                <span style={{flexShrink:0, minWidth:42, boxSizing:"border-box", textAlign:"center", fontSize: 13, lineHeight:"20px", fontWeight:700,
                  color: ok ? T.green500 : T.red500,
                  background: ok ? T.green50 : T.red50,
                  padding:"3px 7px", borderRadius:12}}>
                  {ok ? "가능" : "부족"}
                </span>
              </div>
              {i < reqItems.length - 1 && <div style={{height:1, background:T.grey100, marginLeft:14}}/>}
            </div>
          ))}
        </div>

        {surgery.note && (
          <p style={{margin:"10px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
            메모: {surgery.note}
          </p>
        )}
      </div>

      {!surgery.prep_confirmed ? (
        <div style={{borderTop:`1px solid ${T.grey100}`, padding:"10px 12px 12px", display:"flex", gap:8}}>
          <button onClick={openEditor}
            style={{flex:1, padding:"16px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            <Edit2 size={18}/> 품목 편집
          </button>
          <button onClick={() => confirmSurgeryPrep(surgery.id)}
            style={{flex:2, padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>
            준비 확인 완료
          </button>
        </div>
      ) : (
        <div style={{borderTop:`1px solid ${T.grey100}`, padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.green500}}>✓ 준비 확인 완료</p>
          <button onClick={openEditor}
            style={{padding:"7px 14px", borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey600, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:5}}>
            <Edit2 size={16}/> 편집
          </button>
        </div>
      )}
    </div>
  );
}
