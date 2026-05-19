import { X, LogOut } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { Avatar } from "../shared/Avatar";

export function ProfileSheet({currentUser, onClose, onLogout}) {
  const m = ROLE_META[currentUser.role];

  return (
    <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.4)", zIndex:200, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:T.white, borderRadius:"20px 20px 0 0", width:"100%", paddingBottom:32}} onClick={e=>e.stopPropagation()}>
        {/* 핸들 */}
        <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
          <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
        </div>

        {/* 헤더 */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px 16px"}}>
          <p style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>내 정보</p>
          <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4}}>
            <X size={24} color={T.grey500}/>
          </button>
        </div>

        {/* 사용자 카드 */}
        <div style={{margin:"0 16px 16px", background:T.grey50, borderRadius:14, padding:"16px", display:"flex", alignItems:"center", gap:14}}>
          <Avatar name={currentUser.name} role={currentUser.role} size={48}/>
          <div>
            <p style={{margin:0, fontSize: 20, fontWeight:700, color:T.grey900}}>{currentUser.name}</p>
            <span style={{fontSize: 16, fontWeight:600, color:m.color, background:m.bg, padding:"2px 8px", borderRadius:9999, display:"inline-block", marginTop:4}}>{m.label}</span>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={()=>{ if(window.confirm("로그아웃 하시겠습니까?")) onLogout(); }}
          style={{width:"calc(100% - 32px)", margin:"0 16px", padding:"18px 0", borderRadius:9999, border:"none", background:T.red50, color:T.red500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <LogOut size={20}/> 로그아웃
        </button>

        <p style={{margin:"12px 0 0", textAlign:"center", fontSize: 12, color:T.grey400}}>DentalStock</p>
      </div>
    </div>
  );
}
