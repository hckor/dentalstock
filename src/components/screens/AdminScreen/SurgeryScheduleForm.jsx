import { Edit2, ListChecks } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { Card } from "../../shared/Card";
import { Inp } from "../../shared/Inp";
import { SecTitle } from "../../shared/SecTitle";
import { TemplateChecklistGroup } from "./SurgeryAdminTab.components";

const compactDateTimeInputStyle = {
  height: 46,
  minWidth: 0,
  padding: "10px 12px",
  fontSize: 15,
};

export function SurgeryScheduleForm({
  type,
  setType,
  title,
  setTitle,
  patient,
  setPatient,
  date,
  setDate,
  time,
  setTime,
  note,
  setNote,
  preset,
  templateGroups,
  draftCustomized,
  draftItems,
  items,
  onEditDraft,
  onResetDraft,
  onSubmit,
}) {
  return (
    <>
      <SecTitle>수술 일정 등록</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <p style={{margin:"0 0 8px",fontSize: 16,fontWeight:600,color:T.grey700}}>수술 유형</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          {Object.entries(SURGERY_PRESETS).map(([id,p])=>(
            <button key={id} onClick={()=>{setType(id); setTitle(p.label);}} style={{padding:"14px 0",borderRadius:9999,border:"none",background:type===id?T.blue500:T.grey100,color:type===id?T.white:T.grey700,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font}}>{p.label}</button>
          ))}
        </div>
        <div style={{border:`1px solid ${T.grey100}`,borderRadius:14,padding:14,marginBottom:14,background:T.white}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
            <ListChecks size={18} color={T.blue500}/>
            <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900}}>{preset.label} 준비 체크리스트 템플릿</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(142px, 1fr))",gap:8}}>
            {templateGroups.map(group => <TemplateChecklistGroup key={group.label} group={group}/>)}
          </div>
        </div>
        <SurgeryTextField label="수술명" value={title} onChange={setTitle} placeholder="예: 오전 임플란트 수술"/>
        <SurgeryTextField label="환자명" value={patient} onChange={setPatient} placeholder="예: 홍길동"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(132px, 1fr))",gap:10,marginBottom:10}}>
          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>날짜</p>
            <Inp value={date} onChange={e=>setDate(e.target.value)} type="date" style={compactDateTimeInputStyle}/>
          </div>
          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>시간</p>
            <Inp value={time} onChange={e=>setTime(e.target.value)} type="time" style={compactDateTimeInputStyle}/>
          </div>
        </div>
        <SurgeryTextField label="메모" value={note} onChange={setNote} placeholder="예: 픽스처 사이즈 확인" bottom={14}/>
        <DraftItemsPanel draftCustomized={draftCustomized} draftItems={draftItems} items={items} onEditDraft={onEditDraft} onResetDraft={onResetDraft}/>
        <button onClick={onSubmit} style={{width:"100%",padding:"18px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font}}>수술 일정 등록</button>
      </Card>
    </>
  );
}

function SurgeryTextField({ label, value, onChange, placeholder, bottom = 10 }) {
  return (
    <>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>{label}</p>
      <Inp value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{marginBottom:bottom}}/>
    </>
  );
}

function DraftItemsPanel({ draftCustomized, draftItems, items, onEditDraft, onResetDraft }) {
  return (
    <div style={{background:T.grey50,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}}>
        <p style={{margin:0,fontSize: 16,fontWeight:700,color:T.grey700}}>예상 준비 품목{draftCustomized&&<span style={{marginLeft:6,fontSize: 16,fontWeight:600,color:T.blue500}}>· 사용자 편집</span>}</p>
        <div style={{display:"flex",gap:8}}>
          {draftCustomized&&<button onClick={onResetDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize: 16,color:T.grey500,fontFamily:font,fontWeight:600}}>기본값</button>}
          <button onClick={onEditDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize: 16,color:T.blue500,fontFamily:font,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Edit2 size={16}/>편집</button>
        </div>
      </div>
      {draftItems.length===0 ? (
        <p style={{margin:0,padding:"6px 0",fontSize: 16,color:T.grey500}}>품목이 비어 있어요. "편집"으로 추가하세요.</p>
      ) : draftItems.map((req,i)=>{
        const item = items.find(it=>it.id===req.item_id);
        const enough = item && item.current_qty>=req.qty;
        return (
          <div key={req.item_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:i===0?"0 0 7px":i===draftItems.length-1?"7px 0 0":"7px 0",borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
            <span style={{fontSize: 16,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</span>
            <span style={{fontSize: 16,fontWeight:700,color:enough?T.green500:T.red500,whiteSpace:"nowrap"}}>{req.qty}{item?.unit||""}</span>
          </div>
        );
      })}
    </div>
  );
}
