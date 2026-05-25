import { LogOut, Send, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { T, font } from "../../../constants/colors";
import { ROLE_META } from "../../../constants/permissions";
import { Avatar } from "../../shared/Avatar";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";

export function StaffAdminPanel({
  users,
  currentUser,
  canManageStaff,
  inviteForm,
  setInviteForm,
  inviteBusy,
  submitInvite,
  onStaffActiveChange,
  onStaffRoleChange,
  onStaffDelete,
  onLogout,
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10}}>
        <div style={{minWidth:0}}>
          <p style={{margin:"0 0 2px", fontSize: 16, fontWeight:800, color:T.grey800}}>직원 목록</p>
          {!canManageStaff && <p style={{margin:0, fontSize: 13, color:T.grey500}}>목록은 볼 수 있지만 초대, 권한 변경, 비활성화, 목록 제거는 원장만 가능합니다.</p>}
        </div>
        {canManageStaff && (
          <button
            type="button"
            onClick={() => setShowInviteForm(prev => !prev)}
            style={{flexShrink:0, minHeight:38, border:"none", borderRadius:9999, background:T.grey900, color:T.white, padding:"9px 13px", fontSize:14, fontWeight:800, fontFamily:font, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}
          >
            <UserPlus size={16}/>
            직원 초대
          </button>
        )}
      </div>

      {canManageStaff && showInviteForm && (
        <Card style={{padding:16, marginBottom:12}}>
          <form onSubmit={submitInvite} style={{display:"flex", flexDirection:"column", gap:10}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>
              <div>
                <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey900}}>직원 초대</p>
                <p style={{margin:"2px 0 0", fontSize: 13, color:T.grey500}}>원장 전용 기능입니다. 이메일과 권한만 입력하세요.</p>
              </div>
            </div>
            <input
              value={inviteForm.email}
              onChange={(event)=>setInviteForm(prev=>({...prev, email:event.target.value}))}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="직원 이메일"
              style={{height:48, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"0 14px", fontSize:15, color:T.grey900, fontFamily:font, outlineColor:T.blue500}}
            />
            <div style={{display:"grid", gridTemplateColumns:"1fr 122px", gap:8}}>
              <input
                value={inviteForm.name}
                onChange={(event)=>setInviteForm(prev=>({...prev, name:event.target.value}))}
                placeholder="이름"
                style={{minWidth:0, height:48, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"0 14px", fontSize:15, color:T.grey900, fontFamily:font, outlineColor:T.blue500}}
              />
              <select
                value={inviteForm.role}
                onChange={(event)=>setInviteForm(prev=>({...prev, role:event.target.value}))}
                style={{height:48, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, color:T.grey900, fontFamily:font, fontSize: 14, fontWeight:700, padding:"0 10px", outlineColor:T.blue500}}>
                <option value="hygienist">위생사</option>
                <option value="staff">스태프</option>
                <option value="manager">매니저</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteBusy || !inviteForm.email.trim()}
              style={{height:48, border:"none", borderRadius:12, background:inviteBusy || !inviteForm.email.trim()?T.grey200:T.blue500, color:T.white, fontSize:15, fontWeight:700, fontFamily:font, cursor:inviteBusy || !inviteForm.email.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
              <Send size={17}/>
              {inviteBusy ? "초대 중..." : "초대 보내기"}
            </button>
          </form>
        </Card>
      )}
      <Card style={{marginBottom:16, overflow:"hidden"}}>
        {users.map((u, i) => {
          const m = ROLE_META[u.role] || ROLE_META.hygienist;
          const isMe = u.id === currentUser.id;
          const controlsDisabled = isMe || !canManageStaff;
          return (
            <div key={u.id}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"15px 16px", opacity:u.active?1:0.45}}>
                <Avatar name={u.name} role={u.role} size={38}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <p style={{margin:0, fontSize: 16, lineHeight:"21px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{u.name}</p>
                    {isMe && <span style={{flexShrink:0, fontSize: 11, lineHeight:"15px", fontWeight:800, color:T.blue500, background:T.blue50, padding:"2px 6px", borderRadius:9999}}>나</span>}
                    {!u.active && <span style={{flexShrink:0, fontSize: 11, lineHeight:"15px", fontWeight:800, color:T.red500, background:T.red50, padding:"2px 6px", borderRadius:9999}}>비활성</span>}
                  </div>
                  <p style={{margin:"3px 0 0", fontSize: 13, lineHeight:"18px", fontWeight:700, color:m.color, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{m.label}{u.email ? ` · ${u.email}` : ""}</p>
                </div>
                <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:7, flexShrink:0}}>
                  <select
                    value={u.role}
                    onChange={(event)=>onStaffRoleChange?.(u, event.target.value)}
                    disabled={controlsDisabled}
                    style={{height:34, borderRadius:10, border:`1px solid ${T.grey200}`, background:controlsDisabled?T.grey100:T.white, color:controlsDisabled?T.grey500:T.grey900, fontFamily:font, fontSize: 13, fontWeight:700, padding:"0 8px", outline:"none"}}>
                    <option value="owner">원장</option>
                    <option value="manager">매니저</option>
                    <option value="hygienist">치과위생사</option>
                    <option value="staff">스태프</option>
                  </select>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <button
                      disabled={controlsDisabled}
                      onClick={()=>onStaffActiveChange?.(u, !u.active)}
                      style={{padding:"7px 10px", borderRadius:9999, border:"none", cursor:controlsDisabled?"not-allowed":"pointer", fontFamily:font, fontSize: 12, lineHeight:"16px", fontWeight:800, background:u.active?T.grey100:T.green50, color:u.active?T.grey700:T.green500, opacity:controlsDisabled?0.45:1}}>
                      {u.active?"비활성":"활성화"}
                    </button>
                    <button
                      aria-label={`${u.name} 직원 목록에서 제거`}
                      disabled={controlsDisabled}
                      onClick={()=>onStaffDelete?.(u)}
                      title="직원 목록에서 제거"
                      style={{width:30, height:30, borderRadius:9999, border:"none", background:T.red50, color:T.red500, cursor:controlsDisabled?"not-allowed":"pointer", opacity:controlsDisabled?0.45:1, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}
                    >
                      <Trash2 size={15} color="currentColor"/>
                    </button>
                  </div>
                </div>
              </div>
              {i < users.length-1 && <Divider/>}
            </div>
          );
        })}
      </Card>

      <button onClick={onLogout}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
        <LogOut size={20} color={T.grey600}/> 로그아웃
      </button>
    </>
  );
}
