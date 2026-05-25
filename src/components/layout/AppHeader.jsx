import { Bell } from "lucide-react";
import { T, font } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";
import { ROLE_META } from "../../constants/permissions";

const TAB_TITLES = {
  home: "대시보드", inventory: "재고 목록", inout: "입출고",
  shipping: "발주/배송", alerts: "알림", admin: "관리",
  "shipping:hold": "원장 승인",
  "admin:analytics": "비용 분석",
  "admin:surgery": "수술 관리",
  "admin:staff": "직원 관리",
};

export function AppHeader({ tab, currentUser, unread, setTab, onOpenProfile }) {
  const { tokens: dynamicT } = useTheme();
  const role = currentUser.role;

  return (
    <div style={{background:dynamicT.white, paddingTop:"max(12px, env(safe-area-inset-top))", paddingBottom:14, paddingLeft:20, paddingRight:20, borderBottom:`1px solid ${dynamicT.grey200}`}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
            <p style={{margin:0, fontSize: 13, lineHeight:"20px", color:dynamicT.grey500}}>DentalStock</p>
            <span style={{fontSize: 12, lineHeight:"18px", fontWeight:700, color:ROLE_META[role].color, background:ROLE_META[role].bg, padding:"3px 7px", borderRadius:12}}>{currentUser.name}</span>
          </div>
          <h1 style={{margin:0, fontSize: 26, lineHeight:"36px", fontWeight:700, color:dynamicT.grey900}}>{TAB_TITLES[tab] || "대시보드"}</h1>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:2}}>
          <button onClick={()=>setTab("alerts")}
            style={{position:"relative", background:"none", border:"none", cursor:"pointer", padding:8}}>
            <Bell size={26} color={dynamicT.grey700}/>
            {unread > 0 && (
              <span style={{position:"absolute", top:4, right:4, background:T.red500, color:T.white, borderRadius:9999, fontSize: 12, fontWeight:700, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {unread}
              </span>
            )}
          </button>
          <button onClick={onOpenProfile}
            style={{width:44, height:44, borderRadius:9999, border:"none", background:ROLE_META[role].bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 16, fontWeight:700, color:ROLE_META[role].color, fontFamily:font}}>
            {currentUser.name.slice(0,1)}
          </button>
        </div>
      </div>
    </div>
  );
}
