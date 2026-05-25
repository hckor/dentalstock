import { ChevronRight, ClipboardList, LogOut } from "lucide-react";
import { T, font } from "../../../constants/colors";

export function ManagementHomePanel({
  managementSections,
  openManagementSection,
  setShowInitialInventory,
  onLogout,
}) {
  return (
    <>
      <div style={{marginBottom:12}}>
        <p style={{margin:"0 0 10px", fontSize:16, lineHeight:"22px", fontWeight:900, color:T.grey700}}>관리 메뉴</p>
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {managementSections.map(({id, label, description, Icon, color, onClick}) => (
          <button
            key={label}
            type="button"
            onClick={()=>onClick ? onClick() : openManagementSection(id)}
            style={{minWidth:0, minHeight:68, border:`1px solid ${T.grey200}`, borderRadius:14, background:T.white, padding:"14px 16px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:13}}
          >
            <div style={{width:40, height:40, borderRadius:12, background:T.grey50, color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Icon size={20} color={color}/>
            </div>
            <div style={{flex:1, minWidth:0, display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap"}}>
              <p style={{margin:0, fontSize:16, lineHeight:"22px", fontWeight:900, color:T.grey900, whiteSpace:"nowrap"}}>{label}</p>
              <p style={{margin:0, fontSize:13, lineHeight:"18px", color:T.grey500, wordBreak:"keep-all"}}>{description}</p>
            </div>
            <ChevronRight size={18} color={T.grey400} style={{flexShrink:0}}/>
          </button>
        ))}
        </div>
      </div>

      <button
        type="button"
        onClick={()=>setShowInitialInventory(true)}
        style={{width:"100%", minHeight:68, border:`1px solid ${T.grey200}`, borderRadius:14, background:T.white, padding:"14px 16px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:13, marginBottom:16}}
      >
        <div style={{width:40, height:40, borderRadius:12, background:T.grey50, color:T.grey700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
          <ClipboardList size={20} color="currentColor"/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <p style={{margin:0, fontSize:16, lineHeight:"22px", fontWeight:900, color:T.grey900}}>초기 재고 일괄 입력</p>
          <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>카탈로그와 현재 수량을 한 번에 맞춥니다.</p>
        </div>
        <ChevronRight size={18} color={T.grey400} style={{flexShrink:0}}/>
      </button>

      <button onClick={onLogout}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
        <LogOut size={20} color={T.grey600}/> 로그아웃
      </button>
    </>
  );
}
