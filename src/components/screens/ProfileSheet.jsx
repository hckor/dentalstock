import { X, ChevronRight, User, Bell, HelpCircle, LogOut } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { Avatar } from "../shared/Avatar";
import { Divider } from "../shared/Divider";

export function ProfileSheet({currentUser, onClose, onLogout}) {
  const m = ROLE_META[currentUser.role];

  const menuItems = [
    {Icon:User,       label:"내 계정",      sub:"비밀번호 · 연락처", onClick:()=>{}},
    {Icon:Bell,       label:"알림 설정",    sub:"앱 알림 · 이메일",  onClick:()=>{}},
    {Icon:HelpCircle, label:"도움말 · 문의", sub:null,               onClick:()=>{}},
  ];

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
            <p style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>{currentUser.name} {m.label}</p>
            <p style={{margin:"3px 0 0", fontSize: 16, color:T.grey500}}>{currentUser.role} · DentalStock</p>
          </div>
        </div>

        {/* 메뉴 항목 */}
        <div style={{margin:"0 16px 16px", background:T.white, borderRadius:14, border:`1px solid ${T.grey200}`, overflow:"hidden"}}>
          {menuItems.map((item, i) => {
            const Icon = item.Icon;
            return (
              <div key={item.label}>
                <button onClick={item.onClick} style={{width:"100%", display:"flex", alignItems:"center", gap:14, padding:"18px 20px", border:"none", background:"none", cursor:"pointer", fontFamily:font, textAlign:"left"}}>
                  <div style={{width:44, height:44, borderRadius:9999, background:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <Icon size={20} color={T.grey600}/>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{item.label}</p>
                    {item.sub && <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey500}}>{item.sub}</p>}
                  </div>
                  <ChevronRight size={20} color={T.grey300}/>
                </button>
                {i < menuItems.length-1 && <Divider/>}
              </div>
            );
          })}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={()=>{ if(window.confirm("로그아웃 하시겠습니까?")) onLogout(); }}
          style={{width:"calc(100% - 32px)", margin:"0 16px", padding:"18px 0", borderRadius:9999, border:"none", background:T.red50, color:T.red500, fontSize: 20, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <LogOut size={20}/> 로그아웃
        </button>

        <p style={{margin:"12px 0 0", textAlign:"center", fontSize: 16, color:T.grey300}}>DentalStock · v1.2.0</p>
      </div>
    </div>
  );
}
