import { ChevronRight, Stethoscope } from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { Avatar } from "../shared/Avatar";

export function LoginSelect({users, onSelect}) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", background:T.white}}>
      <div style={{padding:"56px 24px 28px", textAlign:"center"}}>
        <div style={{width:64, height:64, borderRadius:20, background:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px"}}>
          <Stethoscope size={34} color={T.blue500} strokeWidth={2.2}/>
        </div>
        <h1 style={{margin:"0 0 6px", fontSize:24, fontWeight:700, color:T.grey900}}>DentalStock</h1>
        <p style={{margin:0, fontSize:14, color:T.grey500}}>누구로 로그인할까요?</p>
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"0 16px 16px"}}>
        {users.filter(u=>u.active).map((u,i) => {
          const m = ROLE_META[u.role];
          return (
            <button key={u.id} onClick={()=>onSelect(u)}
              style={{width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", marginBottom:8, background:T.white, borderRadius:16, border:`1px solid ${T.grey200}`, cursor:"pointer", fontFamily:font, boxShadow:CS, animation:`fadeUp ${150+i*50}ms both`}}>
              <Avatar name={u.name} role={u.role} size={48}/>
              <div style={{flex:1, textAlign:"left"}}>
                <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900}}>{u.name}</p>
                <span style={{fontSize:12, fontWeight:600, color:m.color, background:m.bg, padding:"2px 8px", borderRadius:9999}}>{m.label}</span>
              </div>
              <ChevronRight size={18} color={T.grey400}/>
            </button>
          );
        })}
      </div>
      <p style={{textAlign:"center", fontSize:12, color:T.grey400, padding:"0 0 28px"}}>데모 PIN: 원장 1234 · 매니저 1111 · 위생사 0000</p>
    </div>
  );
}
