import { useMemo } from "react";
import { T, font, CS, monoFont } from "../../../constants/colors";
import { getStatus } from "../../../utils/helpers";

export function StatsBar({ items, setTab }) {
  const stats = useMemo(() => [
    {label:"전체", value:items.length,                                      color:T.grey900},
	    {label:"정상", value:items.filter(i=>getStatus(i)==="ok").length,        color:T.success},
	    {label:"부족", value:items.filter(i=>getStatus(i)==="warning").length,   color:T.warning},
	    {label:"소진", value:items.filter(i=>getStatus(i)==="danger").length,    color:T.danger},
  ], [items]);

  return (
    <div style={{padding:"16px 16px 0"}}>
      <div style={{display:"flex", background:T.white, borderRadius:12, boxShadow:CS, overflow:"hidden"}}>
        {stats.map((s, i) => (
          <button key={s.label} onClick={()=>setTab("inventory")}
            style={{flex:1, padding:"18px 0", border:"none", background:"none", cursor:"pointer", fontFamily:font, textAlign:"center", borderRight:i<stats.length-1?`1px solid ${T.grey200}`:"none"}}>
            <p style={{margin:0, fontSize: 30, lineHeight:"36px", fontWeight:700, color:s.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
            <p style={{margin:"2px 0 0", fontSize: 13, lineHeight:"20px", color:T.grey500}}>{s.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
