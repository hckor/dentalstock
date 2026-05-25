import { Edit2, ListChecks } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { Card } from "../../shared/Card";
import { Inp } from "../../shared/Inp";
import { SecTitle } from "../../shared/SecTitle";

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
        <TemplateSummaryPanel
          preset={preset}
          templateGroups={templateGroups}
          draftCustomized={draftCustomized}
          draftItems={draftItems}
          items={items}
          onEditDraft={onEditDraft}
          onResetDraft={onResetDraft}
        />
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
        <button onClick={onSubmit} style={{width:"100%",padding:"18px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font}}>수술 일정 등록</button>
      </Card>
    </>
  );
}

function TemplateSummaryPanel({ preset, templateGroups, draftCustomized, draftItems, items, onEditDraft, onResetDraft }) {
  const groupCount = templateGroups.length;
  const itemCount = draftItems.length;
  const itemMap = new Map(items.map(item => [item.id, item]));
  const templateItemMap = new Map(templateGroups.flatMap(group => group.items.map(item => [item.id, item])));
  const draftRows = draftItems.map(req => {
    const item = itemMap.get(req.item_id);
    const templateItem = templateItemMap.get(req.item_id);
    const requiredQty = Number(req.qty) || 0;
    const currentQty = Number(item?.current_qty) || 0;
    const missing = !item;
    const shortage = Boolean(item) && currentQty < requiredQty;
    const name = item?.name || templateItem?.name || `품목 ${req.item_id}`;
    return {
      item,
      missing,
      shortage,
      name,
      statusName: missing ? `${name}(삭제/매칭 실패)` : name,
    };
  });
  const issueRows = draftRows.filter(row => row.missing || row.shortage);
  const missingCount = issueRows.filter(row => row.missing).length;
  const previewItems = (issueRows.length > 0 ? issueRows : draftRows).slice(0, 2).map(row => row.statusName).filter(Boolean);
  const previewMoreCount = Math.max(0, (issueRows.length > 0 ? issueRows.length : draftRows.length) - previewItems.length);
  const hasIssues = issueRows.length > 0;
  const badgeText = hasIssues ? missingCount > 0 ? `확인 ${issueRows.length}` : `부족 ${issueRows.length}` : "재고 OK";
  const badgeBg = hasIssues ? missingCount > 0 ? T.red50 : T.orange50 : T.white;
  const badgeColor = hasIssues ? missingCount > 0 ? T.red500 : T.orange500 : T.grey600;
  const badgeBorder = hasIssues ? missingCount > 0 ? T.dangerLine : T.warningLine : T.grey200;

  return (
    <div style={{border:`1px solid ${T.grey100}`,borderRadius:14,padding:"12px 13px",marginBottom:14,background:T.grey50}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:12,background:T.blue50,color:T.blue500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <ListChecks size={18} color="currentColor"/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:900,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {preset.label} 템플릿 적용
          </p>
          <p style={{margin:"2px 0 0",fontSize:13,lineHeight:"18px",color:hasIssues?badgeColor:T.grey500,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",wordBreak:"keep-all"}}>
            {groupCount}묶음 · {itemCount}품목{previewItems.length ? ` · ${hasIssues ? "확인 " : ""}${previewItems.join(", ")}${previewMoreCount > 0 ? ` 외 ${previewMoreCount}종` : ""}` : ""}
          </p>
        </div>
        <span style={{flexShrink:0,borderRadius:9999,padding:"5px 8px",background:badgeBg,color:badgeColor,fontSize:12,lineHeight:"16px",fontWeight:800,border:`1px solid ${badgeBorder}`}}>
          {badgeText}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:10}}>
        <p style={{margin:0,fontSize:12,lineHeight:"17px",color:T.grey500}}>
          {draftCustomized ? "사용자 편집된 준비 품목입니다." : "기본 템플릿을 사용합니다."}
        </p>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          {draftCustomized&&<button type="button" onClick={onResetDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.grey500,fontFamily:font,fontWeight:800,padding:"4px 0"}}>기본값</button>}
          <button type="button" onClick={onEditDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:T.blue500,fontFamily:font,fontWeight:900,display:"flex",alignItems:"center",gap:3,padding:"4px 0"}}><Edit2 size={14}/>품목 편집</button>
        </div>
      </div>
    </div>
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
