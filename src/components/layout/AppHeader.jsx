import { Bell } from "lucide-react";
import { T, font } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";
import { ROLE_META } from "../../constants/permissions";

const TAB_TITLES = {
  home: "대시보드", inventory: "재고 목록", inout: "입출고",
  order: "발주", alerts: "알림", admin: "관리",
};

export function AppHeader({ tab, currentUser, unread, setTab, onOpenProfile }) {
  const { tokens: dynamicT } = useTheme();
  const role = currentUser.role;

  return (
    <div style={{background:dynamicT.white, paddingTop:"max(12px, env(safe-area-inset-top))", paddingBottom:14, paddingLeft:20, paddingRight:20, borderBottom:`1px solid ${dynamicT.grey100}`}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
            <p style={{margin:0, fontSize:12, color:dynamicT.grey400}}>DentalStock</p>
            <span style={{fontSize:11, fontWeight:600, color:ROLE_META[role].color, background:ROLE_META[role].bg, padding:"1px 8px", borderRadius:9999}}>{currentUser.name}</span>
          </div>
          <h1 style={{margin:0, fontSize:20, fontWeight:700, color:dynamicT.grey900}}>{TAB_TITLES[tab] || "대시보드"}</h1>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:2}}>
          <button onClick={()=>setTab("alerts")}
            style={{position:"relative", background:"none", border:"none", cursor:"pointer", padding:8}}>
            <Bell size={22} color={dynamicT.grey700}/>
            {unread > 0 && (
              <span style={{position:"absolute", top:4, right:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:10, fontWeight:700, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {unread}
              </span>
            )}
          </button>
          <button onClick={onOpenProfile}
            style={{width:32, height:32, borderRadius:9999, border:"none", background:ROLE_META[role].bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:ROLE_META[role].color, fontFamily:font}}>
            {currentUser.name.slice(0,1)}
          </button>
        </div>
      </div>
    </div>
  );
}
