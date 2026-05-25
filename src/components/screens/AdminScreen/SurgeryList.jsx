import { CalendarDays, ClipboardCheck, Edit2, PackageCheck, Trash2 } from "lucide-react";
import { T } from "../../../constants/colors";
import { formatMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { Chip } from "../../shared/Chip";
import { Divider } from "../../shared/Divider";
import { SecTitle } from "../../shared/SecTitle";

export function SurgeryList({ sortedSurgeries, surgeryInsights, openItemsEditor, updateSurgeryItems, onRemoveSurgery }) {
  return (
    <>
      <SecTitle>예정 수술</SecTitle>
      <Card>
        {sortedSurgeries.length===0 ? (
          <p style={{margin:0,padding:"28px 20px",fontSize: 16,color:T.grey500,textAlign:"center"}}>예정 수술이 없어요.</p>
        ) : sortedSurgeries.map((s,i)=>{
          const summary = surgeryInsights.summaries.find(row => row.surgery.id === s.id) || { surgery:s, expectedCost:0, actualCost:0, deltaCost:0, hasActual:false, shortageRows:[], shortageCount:0, statusLabel:"준비전", statusColor:T.orange500, statusBg:T.orange50, unpricedCount:0 };
          return (
            <div key={s.id}>
              <SurgeryRow summary={summary} surgery={s} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems} onRemoveSurgery={onRemoveSurgery}/>
              {i<sortedSurgeries.length-1&&<Divider/>}
            </div>
          );
        })}
      </Card>
    </>
  );
}

function SurgeryRow({ surgery, summary, openItemsEditor, updateSurgeryItems, onRemoveSurgery }) {
  const statusTone = summary.shortageCount ? T.red500 : summary.statusColor;
  const usageText = summary.hasActual
    ? `실사용 ${formatMoney(summary.actualCost)} · ${summary.deltaCost === 0 ? "예상 동일" : `${summary.deltaCost > 0 ? "초과" : "절감"} ${formatMoney(Math.abs(summary.deltaCost))}`}`
    : summary.shortageCount
      ? `부족 ${summary.shortageCount}종 확인 필요`
      : "준비 리스크 없음";

  return (
    <div style={{padding:"16px 16px"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:surgery.prep_confirmed?T.green50:T.blue50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {surgery.usage_confirmed?<PackageCheck size={20} color={T.green500}/>:surgery.prep_confirmed?<ClipboardCheck size={20} color={T.orange500}/>:<CalendarDays size={20} color={T.blue500}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:16,lineHeight:"22px",fontWeight:800,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{surgery.title}</p>
          <p style={{margin:"3px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {surgery.scheduled_date} {surgery.scheduled_time}{surgery.patient ? ` · ${surgery.patient}` : ""}
          </p>
          <p style={{margin:"5px 0 0",fontSize:13,lineHeight:"18px",fontWeight:800,color:statusTone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            품목 {surgery.required_items.length}개 · 예상 {formatMoney(summary.expectedCost)}
          </p>
          {(summary.shortageCount > 0 || summary.hasActual || summary.unpricedCount > 0) && (
            <p style={{margin:"2px 0 0",fontSize:12,lineHeight:"17px",fontWeight:700,color:statusTone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {usageText}{summary.unpricedCount ? ` · 가격 미등록 ${summary.unpricedCount}종` : ""}
            </p>
          )}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:11,paddingLeft:46}}>
        <Chip label={summary.statusLabel} color={summary.statusColor} bg={summary.statusBg} border={T.grey200}/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {!surgery.prep_confirmed&&(
            <button
              aria-label={`${surgery.title} 품목 편집`}
              onClick={()=>openItemsEditor(surgery.required_items, (newItems)=>updateSurgeryItems(surgery.id, newItems), `${surgery.scheduled_date} ${surgery.scheduled_time} · ${surgery.title}`)}
              title="품목 편집"
              style={{border:"none",background:T.grey100,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
            ><Edit2 size={18} color={T.grey700}/></button>
          )}
          <button
            aria-label={`${surgery.title} 삭제`}
            onClick={()=>onRemoveSurgery(surgery)}
            title="수술 삭제"
            style={{border:"none",background:T.red50,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
          ><Trash2 size={16} color={T.red500}/></button>
        </div>
      </div>
    </div>
  );
}
