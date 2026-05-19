import { X, ChevronRight, User, Bell, Moon, HelpCircle, LogOut } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { Avatar } from "../shared/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { Divider } from "../shared/Divider";

export function ProfileSheet({currentUser, onClose, onLogout}) {
  const { mode, toggle, tokens: dynamicT } = useTheme();
  const m = ROLE_META[currentUser.role];

  const menuItems = [
    {Icon:User,   label:"내 계정",      sub:"비밀번호 · 연락처",  chevron:true,  onClick:()=>{}},
    {Icon:Bell,   label:"알림 설정",    sub:"앱 알림 · 이메일",   chevron:true,  onClick:()=>{}},
    {Icon:HelpCircle, label:"도움말 · 문의", sub:null,            chevron:true,  onClick:()=>{}},
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
          <p style={{margin:0, fontSize:17, fontWeight:700, color:T.grey900}}>내 정보</p>
          <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4}}>
            <X size={20} color={T.grey500}/>
          </button>
        </div>

        {/* 사용자 카드 */}
        <div style={{margin:"0 16px 16px", background:T.grey50, borderRadius:14, padding:"16px", display:"flex", alignItems:"center", gap:14}}>
          <Avatar name={currentUser.name} role={currentUser.role} size={48}/>
          <div>
            <p style={{margin:0, fontSize:17, fontWeight:700, color:T.grey900}}>{currentUser.name} {m.label}</p>
            <p style={{margin:"3px 0 0", fontSize:13, color:T.grey500}}>{currentUser.role} · DentalStock</p>
          </div>
        </div>

        {/* 메뉴 항목 */}
        <div style={{margin:"0 16px 12px", background:T.white, borderRadius:14, border:`1px solid ${T.grey200}`, overflow:"hidden"}}>
          {menuItems.map((item, i) => {
            const Icon = item.Icon;
            return (
              <div key={item.label}>
                <button onClick={item.onClick} style={{width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", border:"none", background:"none", cursor:"pointer", fontFamily:font, textAlign:"left"}}>
                  <div style={{width:34, height:34, borderRadius:9999, background:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <Icon size={16} color={T.grey600}/>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.label}</p>
                    {item.sub && <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>{item.sub}</p>}
                  </div>
                  {item.chevron && <ChevronRight size={16} color={T.grey300}/>}
                </button>
                {i < menuItems.length-1 && <Divider/>}
              </div>
            );
          })}

          {/* 다크 모드 토글 */}
          <Divider/>
          <div style={{display:"flex", alignItems:"center", gap:14, padding:"14px 16px"}}>
            <div style={{width:34, height:34, borderRadius:9999, background:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Moon size={16} color={T.grey600}/>
            </div>
            <div style={{flex:1}}>
              <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>화면 테마</p>
            </div>
            {/* 토글 스위치 */}
            <div style={{display:"flex", background:T.grey100, borderRadius:9999, padding:3, gap:2}}>
              {["밝게","어둠게"].map(label => {
                const active = label==="밝게" ? mode==="light" : mode==="dark";
                return (
                  <button key={label} onClick={toggle} style={{padding:"5px 12px", borderRadius:9999, border:"none", background:active?T.white:"transparent", boxShadow:active?"0px 1px 3px rgba(0,0,0,0.1)":"none", cursor:"pointer", fontFamily:font, fontSize:12, fontWeight:active?700:500, color:active?T.grey900:T.grey500, transition:"all 120ms"}}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={()=>{ if(window.confirm("로그아웃 하시겠습니까?")) onLogout(); }}
          style={{width:"calc(100% - 32px)", margin:"0 16px", padding:"14px 0", borderRadius:9999, border:"none", background:T.red50, color:T.red500, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <LogOut size={16}/> 로그아웃
        </button>

        <p style={{margin:"12px 0 0", textAlign:"center", fontSize:12, color:T.grey300}}>DentalStock · v1.2.0</p>
      </div>
    </div>
  );
}
