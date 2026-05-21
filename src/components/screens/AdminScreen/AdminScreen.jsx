import { useState } from "react";
import { LogOut, RotateCcw, ClipboardList, PackagePlus, ChevronRight, Send } from "lucide-react";
import { resetToInitial } from "../../../api/seed";
import { T, font, monoFont } from "../../../constants/colors";
import { can, ROLE_META } from "../../../constants/permissions";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Avatar } from "../../shared/Avatar";
import { AnalyticsTab } from "./AnalyticsTab";
import { SurgeryAdminTab } from "./SurgeryAdminTab";
import { VendorSettingsTab } from "./VendorSettingsTab";
import { ActivityLogTab } from "./ActivityLogTab";
import { BottomSheet } from "../../shared/BottomSheet";
import { InitialInventoryModal } from "../../modals/InitialInventoryModal";

export function AdminScreen({users, currentUser, orders, items, setItems, txs, surgeries, addSurgery, deleteSurgery, onLogout, openItemsEditor, updateSurgeryItems, openModal, showToast, onInviteStaff, onRunPriceMonitor, onStaffActiveChange, onStaffRoleChange}) {
  const [adminTab, setAdminTab] = useState("surgery");
  const [showInitialInventory, setShowInitialInventory] = useState(false);
  const [inviteForm, setInviteForm] = useState({email:"", name:"", role:"hygienist"});
  const [inviteBusy, setInviteBusy] = useState(false);
  const canManageStaff = can(currentUser.role, "staff");

  const handleInitialInventorySave = (quantities) => {
    setItems(prev => prev.map(item =>
      quantities[item.id] !== undefined
        ? { ...item, current_qty: quantities[item.id] }
        : item
    ));
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    if (!canManageStaff || inviteBusy) return;

    const email = inviteForm.email.trim();
    if (!email.includes("@")) {
      showToast?.("초대할 이메일을 확인해주세요");
      return;
    }

    setInviteBusy(true);
    const ok = await onInviteStaff?.({
      email,
      name: inviteForm.name.trim(),
      role: inviteForm.role,
    });
    if (ok) setInviteForm({email:"", name:"", role:"hygienist"});
    setInviteBusy(false);
  };

  const tabs = [
    {id:"surgery",   label:"수술 준비"},
    {id:"analytics", label:"소비 분석"},
    {id:"staff",     label:"직원 관리"},
    {id:"items",     label:"품목 관리"},
    {id:"vendor",    label:"도매 설정"},
    {id:"activity",  label:"활동 로그"},
  ];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column"}}>
      {/* 서브탭 */}
      <div style={{background:T.white, borderBottom:`1px solid ${T.grey200}`, padding:"10px 16px"}}>
        <div style={{position:"relative"}}>
          <div style={{display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingRight:32}}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setAdminTab(t.id)}
                style={{flexShrink:0, padding:"10px 16px", border:"none", borderRadius:12, cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:600,
                  background:adminTab===t.id ? T.white : T.grey100,
                  color:adminTab===t.id ? T.grey900 : T.grey500,
                  boxShadow:adminTab===t.id ? "0px 2px 4px rgba(0,0,0,0.06)" : "none",
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
          <div aria-hidden="true" style={{position:"absolute",top:0,right:0,bottom:0,width:34,pointerEvents:"none",background:"linear-gradient(90deg, rgba(255,255,255,0), #ffffff 72%)",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
            <ChevronRight size={18} color={T.grey400}/>
          </div>
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", background:T.grey50, padding:16}}>

        {adminTab === "analytics" && <AnalyticsTab items={items} txs={txs} orders={orders}/>}

        {adminTab === "surgery" && (
          <SurgeryAdminTab items={items} surgeries={surgeries} addSurgery={addSurgery} deleteSurgery={deleteSurgery} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>
        )}

        {adminTab === "staff" && (
          <>
            {/* 요약 통계 */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
              {[
                {label:"총 입출고", value:txs.length,                                     color:T.blue500},
                {label:"승인 대기", value:orders.filter(o=>o.status==="pending").length,   color:T.orange500},
                {label:"입고 대기", value:orders.filter(o=>o.status==="ordered").length,   color:T.teal500},
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
                const m    = ROLE_META[u.role] || ROLE_META.hygienist;
                const isMe = u.id === currentUser.id;
                const controlsDisabled = isMe || !canManageStaff;
                return (
                  <div key={u.id}>
                    <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px", opacity:u.active?1:0.45}}>
                      <Avatar name={u.name} role={u.role} size={40}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex", alignItems:"center", gap:6}}>
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
        )}

        {adminTab === "items" && (
          <>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
              {[
                {label:"전체 품목", value:items.length, color:T.blue500},
                {label:"부족 품목", value:items.filter(i=>i.current_qty<i.min_qty).length, color:T.orange500},
                {label:"소진 품목", value:items.filter(i=>i.current_qty<=0).length, color:T.red500},
              ].map(s => (
                <Card key={s.label} style={{padding:"12px 10px"}}>
                  <p style={{margin:"0 0 4px", fontSize: 16, color:T.grey500}}>{s.label}</p>
                  <p style={{margin:0, fontSize: 24, fontWeight:700, color:s.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
                </Card>
              ))}
            </div>
            <button
              onClick={() => openModal("add_item")}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
              <PackagePlus size={18}/> 품목 추가
            </button>
            <button
              onClick={() => setShowInitialInventory(true)}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.blue500}33`, background:T.blue50, color:T.blue500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
              <ClipboardList size={18}/> 초기 재고 일괄 입력
            </button>
            <button
              onClick={()=>{
                if (window.confirm("모든 데이터를 초기 상태로 되돌립니다. 계속하시겠습니까?")) {
                  resetToInitial();
                  window.location.reload();
                }
              }}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.orange500}33`, background:T.orange50, color:T.orange500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
              <RotateCcw size={18}/> 초기 데이터로 리셋 (데모용)
            </button>
          </>
        )}

        {adminTab === "vendor" && <VendorSettingsTab currentUser={currentUser} items={items} onRunPriceMonitor={onRunPriceMonitor} showToast={showToast}/>}

        {adminTab === "activity" && <ActivityLogTab/>}
      </div>

      {showInitialInventory && (
        <BottomSheet onClose={() => setShowInitialInventory(false)}>
          <InitialInventoryModal
            items={items}
            onSave={handleInitialInventorySave}
            onClose={() => setShowInitialInventory(false)}
          />
        </BottomSheet>
      )}
    </div>
  );
}
