import { T, monoFont } from "../../../constants/colors";
import { projectedStockAction } from "./SurgeryAdminTab.utils";

export function ProjectedStockRow({ row }) {
  const tone = row.isNewShortage ? T.red500 : row.surgeryDrivenShortageQty > 0 ? T.orange500 : T.grey700;
  const bg = row.isNewShortage ? T.red50 : row.surgeryDrivenShortageQty > 0 ? T.orange50 : T.grey50;
  const title = row.item?.name || "삭제된 품목";
  const surgeryText = `${row.surgeryTitles.slice(0, 2).join(", ")}${row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}`;

  return (
    <div style={{border:`1px solid ${tone}33`,background:bg,borderRadius:12,padding:"12px 13px",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:5}}>
        <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        <span style={{fontSize:14,lineHeight:"20px",fontWeight:800,color:tone,whiteSpace:"nowrap"}}>
          {row.isNewShortage ? "신규 부족" : `${row.afterShortageQty}${row.unit} 미달`}
        </span>
      </div>
      <p style={{margin:0,fontSize:13,lineHeight:"18px",fontWeight:700,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        수술 전 {row.currentQty}{row.unit} / 최소 {row.minQty}{row.unit} → 수술 후 {row.projectedQty}{row.unit}
      </p>
      <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        전 부족 {row.beforeShortageQty}{row.unit} · 후 부족 {row.afterShortageQty}{row.unit} · 필요 {row.requiredQty}{row.unit}
      </p>
      <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {surgeryText || "수술명 없음"} · 다음 행동: {projectedStockAction(row)}
      </p>
    </div>
  );
}

export function MetricTile({ label, value, sub, Icon, color = T.grey900, bg = T.grey50 }) {
  return (
    <div style={{background:bg,borderRadius:12,padding:"14px 13px",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:7}}>
        <p style={{margin:0,fontSize:13,lineHeight:"18px",fontWeight:700,color:T.grey500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</p>
        {Icon && <Icon size={17} color={color} style={{flexShrink:0}}/>}
      </div>
      <p style={{margin:0,fontSize:22,lineHeight:"28px",fontWeight:800,color,fontFamily:monoFont,fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</p>
      {sub && <p style={{margin:"4px 0 0",fontSize:12,lineHeight:"17px",color:T.grey500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</p>}
    </div>
  );
}

export function TemplateChecklistGroup({ group }) {
  const color = group.tone === "primary" ? T.blue500 : group.tone === "warning" ? T.orange500 : T.grey700;
  const bg = group.tone === "primary" ? T.blue50 : group.tone === "warning" ? T.orange50 : T.grey50;
  return (
    <div style={{background:bg,borderRadius:12,padding:"12px 13px",minWidth:0}}>
      <p style={{margin:"0 0 8px",fontSize:13,lineHeight:"18px",fontWeight:800,color}}>{group.label}</p>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {group.items.map(item => (
          <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <span style={{fontSize:13,lineHeight:"18px",fontWeight:700,color:item.registered ? T.grey800 : T.grey400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</span>
            <span style={{fontSize:12,lineHeight:"17px",fontWeight:800,color:item.qty ? color : T.grey500,whiteSpace:"nowrap"}}>
              {item.qty ? `${item.qty}${item.unit}` : "필요시"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryRow({ title, sub, value, tone = "default", action }) {
  const color = tone === "danger" ? T.red500 : tone === "warning" ? T.orange500 : tone === "success" ? T.green500 : T.grey900;
  const bg = tone === "danger" ? T.red50 : tone === "warning" ? T.orange50 : tone === "success" ? T.green50 : T.grey50;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}>
      <div style={{width:8,height:34,borderRadius:9999,background:bg,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:700,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        <p style={{margin:"2px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</p>
        {action && <p style={{margin:"2px 0 0",fontSize:12,lineHeight:"17px",fontWeight:700,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>다음 행동: {action}</p>}
      </div>
      <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color,whiteSpace:"nowrap"}}>{value}</p>
    </div>
  );
}
