import { LogOut, Send } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { ROLE_META } from "../../../constants/permissions";
import { Avatar } from "../../shared/Avatar";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { compactCount, formatRelativeActivity } from "./adminUtils";

export function StaffAdminPanel({
  users,
  currentUser,
  canManageStaff,
  inviteForm,
  setInviteForm,
  inviteBusy,
  submitInvite,
  todayStaffTotals,
  staffSummaryById,
  onStaffActiveChange,
  onStaffRoleChange,
  onLogout,
}) {
  return (
    <>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
        {[
          {label:"오늘 입출고", value:todayStaffTotals.stock,  color:T.blue500},
          {label:"발주 요청", value:todayStaffTotals.orders,   color:T.orange500},
          {label:"수술 준비", value:todayStaffTotals.prep,     color:T.green500},
        ].map(s => (
          <Card key={s.label} style={{padding:"12px 10px"}}>
            <p style={{margin:"0 0 4px", fontSize: 16, color:T.grey500}}>{s.label}</p>
            <p style={{margin:0, fontSize: 24, fontWeight:700, color:s.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12, marginBottom:10}}>
        <div>
          <p style={{margin:"0 0 2px", fontSize: 16, fontWeight:600, color:T.grey600}}>직원 목록</p>
          <p style={{margin:"0 0 2px", fontSize: 13, color:T.grey500}}>오늘 처리량과 최근 활동을 함께 확인합니다.</p>
          {!canManageStaff && <p style={{margin:0, fontSize: 13, color:T.grey500}}>원장 계정만 직원 상태와 권한을 바꿀 수 있습니다.</p>}
        </div>
      </div>
      {canManageStaff && (
        <Card style={{padding:16, marginBottom:12}}>
          <form onSubmit={submitInvite} style={{display:"flex", flexDirection:"column", gap:10}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>
              <div>
                <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey900}}>직원 초대</p>
                <p style={{margin:"2px 0 0", fontSize: 13, color:T.grey500}}>이메일로 초대하고 권한을 미리 지정합니다.</p>
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
      <Card style={{marginBottom:16}}>
        {users.map((u, i) => {
          const m = ROLE_META[u.role] || ROLE_META.hygienist;
          const isMe = u.id === currentUser.id;
          const controlsDisabled = isMe || !canManageStaff;
          const summary = staffSummaryById.get(u.id) || {todayStockTxs:0, todayOrderRequests:0, todayPrepConfirmations:0, recentActivities:[], lastActivity:null};
          const lastActivity = summary.lastActivity;
          return (
            <div key={u.id}>
              <div style={{display:"flex", flexDirection:"column", gap:12, padding:"18px 20px", opacity:u.active?1:0.45}}>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <Avatar name={u.name} role={u.role} size={40}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                      <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{u.name}</p>
                      {isMe && <span style={{fontSize: 12, fontWeight:700, color:T.blue500, background:T.blue50, padding:"1px 6px", borderRadius:9999}}>나</span>}
                      {!u.active && <span style={{fontSize: 12, fontWeight:700, color:T.red500, background:T.red50, padding:"1px 6px", borderRadius:9999}}>비활성</span>}
                    </div>
                    <div style={{display:"flex", flexDirection:"column", gap:2, marginTop:2}}>
                      <span style={{fontSize: 16, fontWeight:600, color:m.color}}>{m.label}</span>
                      {u.email && <span style={{fontSize: 13, color:T.grey500, wordBreak:"break-all"}}>{u.email}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8}}>
                    <select
                      value={u.role}
                      onChange={(event)=>onStaffRoleChange?.(u, event.target.value)}
                      disabled={controlsDisabled}
                      style={{height:36, borderRadius:12, border:`1px solid ${T.grey200}`, background:controlsDisabled?T.grey100:T.white, color:controlsDisabled?T.grey500:T.grey900, fontFamily:font, fontSize: 13, fontWeight:700, padding:"0 10px", outline:"none"}}>
                      <option value="owner">원장</option>
                      <option value="manager">매니저</option>
                      <option value="hygienist">치과위생사</option>
                      <option value="staff">스태프</option>
                    </select>
                    <button
                      disabled={controlsDisabled}
                      onClick={()=>onStaffActiveChange?.(u, !u.active)}
                      style={{padding:"10px 14px", borderRadius:9999, border:"none", cursor:controlsDisabled?"not-allowed":"pointer", fontFamily:font, fontSize: 14, fontWeight:700, background:u.active?T.red50:T.green50, color:u.active?T.red500:T.green500, opacity:controlsDisabled?0.45:1}}>
                      {u.active?"비활성":"활성화"}
                    </button>
                  </div>
                </div>

                <div style={{display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:8}}>
                  {[
                    {label:"입출고", value:summary.todayStockTxs, color:T.blue500},
                    {label:"발주", value:summary.todayOrderRequests, color:T.orange500},
                    {label:"수술준비", value:summary.todayPrepConfirmations, color:T.green500},
                  ].map(metric => (
                    <div key={metric.label} style={{minWidth:0, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"9px 10px"}}>
                      <p style={{margin:"0 0 3px", fontSize:12, lineHeight:"16px", fontWeight:700, color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{metric.label}</p>
                      <p style={{margin:0, fontSize:18, lineHeight:"22px", fontWeight:800, color:metric.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{compactCount(metric.value)}</p>
                    </div>
                  ))}
                </div>

                <div style={{borderRadius:12, background:lastActivity?T.white:T.grey50, border:`1px solid ${T.grey200}`, padding:"10px 12px"}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:summary.recentActivities.length ? 8 : 0}}>
                    <div style={{width:8, height:8, borderRadius:9999, background:lastActivity?.color || T.grey300, flexShrink:0}}/>
                    <p style={{margin:0, flex:1, minWidth:0, fontSize:13, lineHeight:"18px", color:T.grey600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                      {lastActivity ? `최근 ${lastActivity.title} · ${lastActivity.detail}` : "최근 활동이 없습니다"}
                    </p>
                    <span style={{flexShrink:0, fontSize:12, fontWeight:700, color:T.grey500}}>{formatRelativeActivity(lastActivity?.at)}</span>
                  </div>
                  {summary.recentActivities.length > 0 && (
                    <div style={{display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none"}}>
                      {summary.recentActivities.map((activity, index) => (
                        <span key={`${activity.title}-${activity.at}-${index}`} style={{flexShrink:0, display:"inline-flex", alignItems:"center", gap:5, maxWidth:210, borderRadius:9999, background:T.grey50, color:T.grey700, border:`1px solid ${T.grey200}`, padding:"6px 9px", fontSize:12, fontWeight:700}}>
                          <span style={{width:6, height:6, borderRadius:9999, background:activity.color, flexShrink:0}}/>
                          <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{activity.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
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
