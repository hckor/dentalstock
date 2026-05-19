import { useMemo } from "react";
import { T, font, CS } from "../../../constants/colors";
import { getStatus } from "../../../utils/helpers";

export function StatsBar({ items, setTab }) {
  const stats = useMemo(() => [
    {label:"전체", value:items.length,                                      color:T.grey900},
    {label:"정상", value:items.filter(i=>getStatus(i)==="ok").length,        color:T.green500},
    {label:"부족", value:items.filter(i=>getStatus(i)==="warning").length,   color:T.orange500},
    {label:"소진", value:items.filter(i=>getStatus(i)==="danger").length,    color:T.red500},
  ], [items]);

  return (
    <div style={{padding:"16px 16px 0"}}>
      <div style={{display:"flex", background:T.white, borderRadius:14, boxShadow:CS, overflow:"hidden"}}>
        {stats.map((s, i) => (
          <button key={s.label} onClick={()=>setTab("inventory")}
            style={{flex:1, padding:"16px 0", border:"none", background:"none", cursor:"pointer", fontFamily:font, textAlign:"center", borderRight:i<stats.length-1?`1px solid ${T.grey100}`:"none"}}>
            <p style={{margin:0, fontSize:28, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
            <p style={{margin:"3px 0 0", fontSize:16, color:T.grey500}}>{s.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
