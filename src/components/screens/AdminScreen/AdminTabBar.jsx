import { ChevronRight } from "lucide-react";
import { T, font } from "../../../constants/colors";

export function AdminTabBar({ tabs, adminTab, setAdminTab }) {
  return (
    <div style={{background:T.white, borderBottom:`1px solid ${T.grey200}`, padding:"10px 16px"}}>
      <div style={{position:"relative"}}>
        <div style={{display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingRight:32}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setAdminTab(t.id)}
              style={{flexShrink:0, padding:"10px 16px", border:"none", borderRadius:12, cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:600,
                background:adminTab===t.id ? T.white : T.grey100,
                color:adminTab===t.id ? T.grey900 : T.grey500,
                boxShadow:adminTab===t.id ? T.shadowSelected : "none",
                display:"flex", alignItems:"center", gap:5, transition:"all 150ms"}}>
              {t.label}
              {t.badge>0 && (
                <span style={{background:adminTab===t.id?T.red500:T.red500, color:T.white, borderRadius:9999, fontSize: 12, fontWeight:700, padding:"1px 6px"}}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div aria-hidden="true" style={{position:"absolute",top:0,right:0,bottom:0,width:34,pointerEvents:"none",background:T.surfaceFadeRight,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
          <ChevronRight size={18} color={T.grey400}/>
        </div>
      </div>
    </div>
  );
}
