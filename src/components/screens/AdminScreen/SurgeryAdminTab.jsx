import { useState, useEffect } from "react";
import { Edit2, CalendarDays, ClipboardCheck } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { todayKey } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { SecTitle } from "../../shared/SecTitle";
import { Inp } from "../../shared/Inp";

export function SurgeryAdminTab({items, surgeries, addSurgery, openItemsEditor, updateSurgeryItems}) {
  const [type, setType] = useState("implant");
  const [title, setTitle] = useState("오전 임플란트 수술");
  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("10:30");
  const [note, setNote] = useState("");
  const preset = SURGERY_PRESETS[type];
  const [draftItems, setDraftItems] = useState(preset.items.map(r=>({...r})));
  const [draftCustomized, setDraftCustomized] = useState(false);
  const sortedSurgeries = [...surgeries].sort((a,b)=>`${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`));

  // 수술 유형 변경 시 사용자 편집이 없었다면 프리셋으로 동기화
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!draftCustomized) setDraftItems(preset.items.map(r=>({...r})));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = () => {
    addSurgery({type, title:title.trim()||preset.label, patient:patient.trim(), scheduled_date:date, scheduled_time:time, note:note.trim(), required_items:draftItems});
    setTitle(preset.label);
    setPatient("");
    setNote("");
    setDraftItems(preset.items.map(r=>({...r})));
    setDraftCustomized(false);
  };

  const editDraft = () => openItemsEditor(
    draftItems,
    (newItems)=>{ setDraftItems(newItems); setDraftCustomized(true); },
    `${preset.label} · ${title || preset.label}`,
  );
  const resetDraft = () => { setDraftItems(preset.items.map(r=>({...r}))); setDraftCustomized(false); };

  return (
    <>
      <SecTitle>수술 일정 등록</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>수술 유형</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          {Object.entries(SURGERY_PRESETS).map(([id,p])=>(
            <button key={id} onClick={()=>{setType(id); setTitle(p.label);}} style={{padding:"9px 0",borderRadius:9999,border:"none",background:type===id?T.blue500:T.grey100,color:type===id?T.white:T.grey700,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font}}>{p.label}</button>
          ))}
        </div>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>수술명</p>
        <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 오전 임플란트 수술" style={{marginBottom:10}}/>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>환자명</p>
        <Inp value={patient} onChange={e=>setPatient(e.target.value)} placeholder="예: 홍길동" style={{marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>날짜</p><Inp value={date} onChange={e=>setDate(e.target.value)} type="date"/></div>
          <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>시간</p><Inp value={time} onChange={e=>setTime(e.target.value)} type="time"/></div>
        </div>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>메모</p>
        <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 픽스처 사이즈 확인" style={{marginBottom:14}}/>

        <div style={{background:T.grey50,borderRadius:12,padding:"10px 12px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}}>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:T.grey700}}>예상 준비 품목{draftCustomized&&<span style={{marginLeft:6,fontSize:11,fontWeight:600,color:T.blue500}}>· 사용자 편집</span>}</p>
            <div style={{display:"flex",gap:8}}>
              {draftCustomized&&<button onClick={resetDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.grey500,fontFamily:font,fontWeight:600}}>기본값</button>}
              <button onClick={editDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.blue500,fontFamily:font,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Edit2 size={12}/>편집</button>
            </div>
          </div>
          {draftItems.length===0 ? (
            <p style={{margin:0,padding:"6px 0",fontSize:12,color:T.grey500}}>품목이 비어 있어요. "편집"으로 추가하세요.</p>
          ) : draftItems.map((req,i)=>{
            const item = items.find(it=>it.id===req.item_id);
            const enough = item && item.current_qty>=req.qty;
            return (
              <div key={req.item_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:i===0?"0 0 7px":i===draftItems.length-1?"7px 0 0":"7px 0",borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                <span style={{fontSize:12,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</span>
                <span style={{fontSize:12,fontWeight:700,color:enough?T.green500:T.red500,whiteSpace:"nowrap"}}>{req.qty}{item?.unit||""}</span>
              </div>
            );
          })}
        </div>
        <button onClick={submit} style={{width:"100%",padding:"14px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>수술 일정 등록</button>
      </Card>

      <SecTitle>예정 수술</SecTitle>
      <Card>
        {sortedSurgeries.map((s,i)=>(
          <div key={s.id}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.prep_confirmed?T.green50:T.blue50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {s.prep_confirmed?<ClipboardCheck size={16} color={T.green500}/>:<CalendarDays size={16} color={T.blue500}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{s.scheduled_date} {s.scheduled_time} · {s.patient} · 품목 {s.required_items.length}개</p>
              </div>
              <Chip label={s.prep_confirmed?"준비완료":"준비전"} color={s.prep_confirmed?T.green500:T.orange500} bg={s.prep_confirmed?T.green50:T.orange50} border={T.grey200}/>
              {!s.prep_confirmed&&(
                <button
                  onClick={()=>openItemsEditor(s.required_items, (newItems)=>updateSurgeryItems(s.id, newItems), `${s.scheduled_date} ${s.scheduled_time} · ${s.title}`)}
                  title="품목 편집"
                  style={{border:"none",background:T.grey100,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
                ><Edit2 size={14} color={T.grey700}/></button>
              )}
            </div>
            {i<sortedSurgeries.length-1&&<Divider/>}
          </div>
        ))}
      </Card>
    </>
  );
}
