import { useMemo, useState } from "react";
import { ArrowLeft, LogOut, RotateCcw, ClipboardList, PackagePlus, ChevronRight, Send, ClipboardCheck, UsersRound, Tags, Store, History, Settings2 } from "lucide-react";
import { resetToInitial } from "../../../api/seed";
import { supabaseItemsApi } from "../../../api/supabaseItemsApi";
import { T, font, monoFont } from "../../../constants/colors";
import { can, ROLE_META } from "../../../constants/permissions";
import { getItemIdentityKey } from "../../../utils/itemIdentity";
import { dateKey, todayKey } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Avatar } from "../../shared/Avatar";
import { AnalyticsTab } from "./AnalyticsTab";
import { SurgeryAdminTab } from "./SurgeryAdminTab";
import { VendorSettingsTab } from "./VendorSettingsTab";
import { ActivityLogTab } from "./ActivityLogTab";
import { BottomSheet } from "../../shared/BottomSheet";
import { InitialInventoryModal } from "../../modals/InitialInventoryModal";
import { StocktakeSheet } from "../../modals/StocktakeSheet";
import { useInventory } from "../../../contexts/InventoryContext";
import { useOrders } from "../../../contexts/OrderContext";
import { useSurgery } from "../../../contexts/SurgeryContext";

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isTodayValue = (value, today) => {
  const date = toValidDate(value);
  return date ? dateKey(date) === today : false;
};

const formatRelativeActivity = (value) => {
  const date = toValidDate(value);
  if (!date) return "활동 없음";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", {month:"2-digit", day:"2-digit"});
};

const compactCount = (value) => value > 99 ? "99+" : String(value);

function ManagementSectionHeader({ section, onBack }) {
  if (!section) return null;
  const Icon = section.Icon;
  return (
    <Card style={{ padding: 0, marginBottom: 12, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onBack}
        style={{ width: "100%", border: "none", background: T.white, color: T.grey700, padding: "13px 15px", fontSize: 14, lineHeight: "19px", fontWeight: 800, fontFamily: font, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, textAlign: "left" }}
      >
        <ArrowLeft size={17} />
        관리 메인
      </button>
      <Divider />
      <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: T.grey50, color: section.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={21} color="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 900, color: T.grey900 }}>{section.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", color: T.grey600, wordBreak: "keep-all" }}>{section.description}</p>
        </div>
        <span style={{ flexShrink: 0, maxWidth: 96, borderRadius: 9999, padding: "6px 9px", background: T.grey50, color: T.grey700, fontSize: 12, lineHeight: "16px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {section.detail}
        </span>
      </div>
    </Card>
  );
}

export function AdminScreen({initialTab = "surgery", standalone = false, managementOnly = false, users, currentUser, onLogout, openItemsEditor, openModal, showToast, onInviteStaff, onRunPriceMonitor, onStaffActiveChange, onStaffRoleChange}) {
  const { items, setItems, txs, setTxs } = useInventory();
  const { orders } = useOrders();
  const { surgeries, addSurgery, deleteSurgery, updateSurgeryItems } = useSurgery();
  const [adminTab, setAdminTab] = useState(initialTab === "stock" ? "items" : initialTab);
  const [managementView, setManagementView] = useState(null);
  const [showInitialInventory, setShowInitialInventory] = useState(false);
  const [showStocktake, setShowStocktake] = useState(false);
  const [inviteForm, setInviteForm] = useState({email:"", name:"", role:"hygienist"});
  const [inviteBusy, setInviteBusy] = useState(false);
  const canManageStaff = can(currentUser.role, "staff");
  const temporaryItems = items.filter(item => item.is_temporary && item.temporary_status !== "resolved");
  const activeStaffCount = users.filter(user => user.active).length;
  const inactiveStaffCount = users.length - activeStaffCount;
  const baselineReadyCount = items.filter(item => Number(item.min_qty) > 0 && item.unit && item.location).length;
  const vendorLinkedCount = items.filter(item => Array.isArray(item.vendor_options) && item.vendor_options.length > 0).length;
  const pendingOrderPolicyCount = orders.filter(order => order.status === "pending").length;
  const staffSummaries = useMemo(() => {
    const today = todayKey();
    const itemMap = new Map(items.map(item => [item.id, item]));

    return users.map(user => {
      const userName = user.name;
      const stockTxs = txs.filter(tx => tx.user === userName);
      const orderRequests = orders.filter(order => order.requested_by === userName);
      const orderReviews = orders.filter(order => order.reviewed_by === userName && order.reviewed_at);
      const prepConfirmations = surgeries.filter(surgery => surgery.prepared_by === userName && surgery.prepared_at);
      const usageConfirmations = surgeries.filter(surgery => surgery.usage_confirmed_by === userName && surgery.usage_confirmed_at);

      const activities = [
        ...stockTxs.map(tx => {
          const item = itemMap.get(tx.item_id);
          return {
            at: tx.created_at,
            title: tx.type === "in" ? "입고 등록" : "출고 등록",
            detail: item?.name || tx.item_name || "재고 기록",
            color: tx.type === "in" ? T.teal500 : T.orange500,
          };
        }),
        ...orderRequests.map(order => {
          const item = itemMap.get(order.item_id);
          return {
            at: order.requested_at,
            title: "발주 요청",
            detail: item?.name || "품목 미지정",
            color: T.blue500,
          };
        }),
        ...orderReviews.map(order => {
          const item = itemMap.get(order.item_id);
          return {
            at: order.reviewed_at,
            title: order.status === "rejected" ? "발주 반려" : "발주 승인",
            detail: item?.name || "품목 미지정",
            color: order.status === "rejected" ? T.red500 : T.green500,
          };
        }),
        ...prepConfirmations.map(surgery => ({
          at: surgery.prepared_at,
          title: "수술 준비 확인",
          detail: surgery.title || "수술 일정",
          color: T.green500,
        })),
        ...usageConfirmations.map(surgery => ({
          at: surgery.usage_confirmed_at,
          title: "실사용량 확인",
          detail: surgery.title || "수술 일정",
          color: T.purple500,
        })),
      ]
        .filter(activity => toValidDate(activity.at))
        .sort((a, b) => toValidDate(b.at).getTime() - toValidDate(a.at).getTime());

      return {
        userId: user.id,
        todayStockTxs: stockTxs.filter(tx => isTodayValue(tx.created_at, today)).length,
        todayOrderRequests: orderRequests.filter(order => isTodayValue(order.requested_at, today)).length,
        todayPrepConfirmations: prepConfirmations.filter(surgery => isTodayValue(surgery.prepared_at, today)).length,
        recentActivities: activities.slice(0, 3),
        lastActivity: activities[0] || null,
      };
    });
  }, [items, orders, surgeries, txs, users]);
  const staffSummaryById = useMemo(
    () => new Map(staffSummaries.map(summary => [summary.userId, summary])),
    [staffSummaries]
  );
  const todayStaffTotals = useMemo(() => staffSummaries.reduce((totals, summary) => ({
    stock: totals.stock + summary.todayStockTxs,
    orders: totals.orders + summary.todayOrderRequests,
    prep: totals.prep + summary.todayPrepConfirmations,
  }), {stock:0, orders:0, prep:0}), [staffSummaries]);

  const handleInitialInventorySave = async (payload) => {
    const quantities = payload?.quantities || payload || {};
    const newItems = Array.isArray(payload?.newItems) ? payload.newItems : [];
    const existingIdentityKeys = new Set(items.map(item => getItemIdentityKey(item.name)).filter(Boolean));
    const uniqueNewItems = newItems.filter(item => {
      const key = getItemIdentityKey(item.name);
      if (!key || items.some(existing => existing.id === item.id) || existingIdentityKeys.has(key)) return false;
      existingIdentityKeys.add(key);
      return true;
    });
    const nextItems = [
      ...items.map(item =>
        quantities[item.id] !== undefined
          ? { ...item, current_qty: quantities[item.id] }
          : item
      ),
      ...uniqueNewItems,
    ];

    const addedCount = nextItems.length - items.length;

    try {
      if (supabaseItemsApi.isEnabled()) {
        if (!currentUser?.clinicId) {
          showToast?.("클리닉 연결을 확인한 뒤 다시 저장해주세요");
          return false;
        }
        const remoteItems = await supabaseItemsApi.saveInitialInventory(currentUser.clinicId, nextItems);
        setItems(remoteItems);
      } else {
        setItems(nextItems);
      }
      showToast?.(addedCount > 0 ? `카탈로그 품목 ${addedCount}개를 추가했습니다` : "초기 재고를 저장했습니다");
      return true;
    } catch (error) {
      console.error("Failed to save initial inventory", error);
      showToast?.("초기 재고를 저장하지 못했습니다");
      return false;
    }
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

  const allTabs = [
    {id:"surgery",   label:"수술 준비"},
    {id:"analytics", label:"소비 분석"},
    {id:"staff",     label:"직원 관리"},
    {id:"items",     label:"품목 관리"},
    {id:"vendor",    label:"도매 설정"},
    {id:"activity",  label:"활동 로그"},
  ];
  const managementTabIds = ["staff", "items", "vendor", "activity"];
  const tabs = managementOnly
    ? allTabs.filter(tab => managementTabIds.includes(tab.id))
    : allTabs;
  const managementSections = [
    {id:"staff", label:"직원 관리", detail:`활성 ${activeStaffCount}명`, description:"직원 초대, 권한 변경, 활성/비활성 상태를 관리합니다.", Icon:UsersRound, color:T.blue500},
    {id:"items", label:"품목 관리", detail:`기준 ${baselineReadyCount}/${items.length}`, description:"품목 추가, 기준값 입력, 재고실사와 초기 데이터를 정리합니다.", Icon:Tags, color:T.green500},
    {id:"vendor", label:"도매 설정", detail:`연동 ${vendorLinkedCount}개`, description:"거래처 계정, 자동발주 조건, 가격 감시 정책을 설정합니다.", Icon:Store, color:T.orange500},
    {id:"activity", label:"활동 로그", detail:"변경 이력", description:"입출고, 발주, 수술 준비, 보안 관련 기록을 확인합니다.", Icon:History, color:T.grey700},
  ];
  const selectedManagementSection = managementSections.find(section => section.id === adminTab);
  const openManagementSection = (id) => {
    setAdminTab(id);
    setManagementView(id);
  };
  const showManagementHome = managementOnly && !managementView;

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column"}}>
      {!standalone && !managementOnly && (
        <div style={{background:T.white, borderBottom:`1px solid ${T.grey200}`, padding:"10px 16px"}}>
          <div style={{position:"relative"}}>
            <div style={{display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingRight:32}}>
              {tabs.map(t => (
                <button key={t.id} onClick={()=>setAdminTab(t.id)}
                  style={{flexShrink:0, padding:"10px 16px", border:"none", borderRadius:12, cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:600,
                    background:adminTab===t.id ? T.white : T.grey100,
                    color:adminTab===t.id ? T.grey900 : T.grey500,
                    boxShadow:adminTab===t.id ? T.shadowSelected : "none",
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
            <div aria-hidden="true" style={{position:"absolute",top:0,right:0,bottom:0,width:34,pointerEvents:"none",background:T.surfaceFadeRight,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
              <ChevronRight size={18} color={T.grey400}/>
            </div>
          </div>
        </div>
      )}

      <div style={{flex:1, overflowY:"auto", background:T.grey50, padding:16}}>
        {showManagementHome ? (
          <>
            <Card style={{padding:16, marginBottom:12}}>
              <div style={{display:"flex", alignItems:"flex-start", gap:12}}>
                <div style={{width:40, height:40, borderRadius:12, background:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  <Settings2 size={21} color={T.blue500}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize:18, lineHeight:"24px", fontWeight:900, color:T.grey900}}>관리 메인</p>
                  <p style={{margin:"4px 0 0", fontSize:14, lineHeight:"20px", color:T.grey600, wordBreak:"keep-all"}}>
                    직원, 품목, 도매 설정, 활동 로그를 각각 독립된 화면에서 관리합니다.
                  </p>
                </div>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:8, marginTop:14}}>
                {[
                  {label:"활성 직원", value:activeStaffCount, detail:inactiveStaffCount ? `비활성 ${inactiveStaffCount}` : "전체 활성", color:T.blue500},
                  {label:"기준값 완료", value:baselineReadyCount, detail:`전체 ${items.length}`, color:T.green500},
                  {label:"승인 대기", value:pendingOrderPolicyCount, detail:"발주 정책 확인", color:T.orange500},
                ].map(summary => (
                  <div key={summary.label} style={{minWidth:0, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"10px 11px"}}>
                    <p style={{margin:"0 0 4px", fontSize:12, lineHeight:"16px", fontWeight:700, color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{summary.label}</p>
                    <p style={{margin:0, fontSize:21, lineHeight:"25px", fontWeight:800, color:summary.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{compactCount(summary.value)}</p>
                    <p style={{margin:"2px 0 0", fontSize:11, lineHeight:"15px", color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{summary.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{marginBottom:10}}>
              <p style={{margin:"0 0 8px", fontSize:15, lineHeight:"21px", fontWeight:900, color:T.grey700}}>관리 메뉴</p>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {managementSections.map(({id, label, detail, description, Icon, color}) => (
                <button
                  key={label}
                  type="button"
                  onClick={()=>openManagementSection(id)}
                  style={{minWidth:0, minHeight:76, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"13px 14px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}
                >
                  <div style={{width:38, height:38, borderRadius:12, background:T.grey50, color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    <Icon size={18} color={color}/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:"flex", alignItems:"center", gap:7, minWidth:0}}>
                      <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:900, color:T.grey900, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{label}</p>
                      <span style={{flexShrink:0, borderRadius:9999, background:T.grey50, color:T.grey600, padding:"3px 7px", fontSize:11, lineHeight:"15px", fontWeight:800}}>{detail}</span>
                    </div>
                    <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", wordBreak:"keep-all"}}>{description}</p>
                  </div>
                  <ChevronRight size={16} color={T.grey400} style={{flexShrink:0}}/>
                </button>
              ))}
              </div>
            </div>

            <button
              type="button"
              onClick={()=>setShowInitialInventory(true)}
              style={{width:"100%", minHeight:58, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12, marginBottom:16}}
            >
              <div style={{width:38, height:38, borderRadius:12, background:T.grey50, color:T.grey700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <ClipboardList size={18} color="currentColor"/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:900, color:T.grey900}}>초기 재고 일괄 입력</p>
                <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>카탈로그와 현재 수량을 한 번에 맞춥니다.</p>
              </div>
              <ChevronRight size={16} color={T.grey400} style={{flexShrink:0}}/>
            </button>

            <button onClick={onLogout}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
              <LogOut size={20} color={T.grey600}/> 로그아웃
            </button>
          </>
        ) : (
          <>
            {managementOnly && (
              <ManagementSectionHeader
                section={selectedManagementSection}
                onBack={()=>setManagementView(null)}
              />
            )}

        {adminTab === "analytics" && <AnalyticsTab items={items} txs={txs} orders={orders}/>}

        {adminTab === "surgery" && (
          <SurgeryAdminTab items={items} surgeries={surgeries} addSurgery={addSurgery} deleteSurgery={deleteSurgery} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems} openModal={openModal}/>
        )}

        {adminTab === "staff" && (
          <>
            {/* 요약 통계 */}
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
                const m    = ROLE_META[u.role] || ROLE_META.hygienist;
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
        )}

        {adminTab === "items" && (
          <>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
              {[
                {label:"전체 품목", value:items.length, color:T.blue500},
                {label:"기준값 완료", value:baselineReadyCount, color:T.green500},
                {label:"정리 필요", value:temporaryItems.length, color:T.red500},
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
              <PackagePlus size={18}/> 품목 기준값 추가
            </button>
            <button
              onClick={() => setShowStocktake(true)}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.blue500}33`, background:T.white, color:T.blue500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
              <ClipboardCheck size={18}/> 기준 수량 보정
            </button>
            <button
              onClick={() => setShowInitialInventory(true)}
              style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.blue500}33`, background:T.blue50, color:T.blue500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8}}>
              <ClipboardList size={18}/> 초기 재고 / 기준값 일괄 입력
            </button>
            {temporaryItems.length > 0 && (
              <Card style={{padding:16, margin:"8px 0 12px"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10}}>
                  <div>
                    <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900}}>정리 필요 품목</p>
                    <p style={{margin:"2px 0 0", fontSize:13, color:T.grey500}}>카탈로그에 없는 품목은 나중에 정식 품목으로 확정해주세요.</p>
                  </div>
                  <span style={{flexShrink:0, borderRadius:9999, padding:"4px 9px", background:T.red50, color:T.red500, fontSize:13, fontWeight:700}}>{temporaryItems.length}건</span>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  {temporaryItems.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openModal("edit_item", item)}
                      style={{width:"100%", border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontFamily:font}}>
                      <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:700, color:T.grey900, overflowWrap:"anywhere", wordBreak:"keep-all"}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>{item.current_qty}{item.unit} · {item.location || "위치 없음"}</p>
                    </button>
                  ))}
                  {temporaryItems.length > 4 && <p style={{margin:0, fontSize:13, color:T.grey500}}>외 {temporaryItems.length - 4}개가 더 있어요.</p>}
                </div>
              </Card>
            )}
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
          </>
        )}
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

      {showStocktake && (
        <BottomSheet onClose={() => setShowStocktake(false)}>
          <StocktakeSheet
            items={items}
            setItems={setItems}
            setTxs={setTxs}
            currentUser={currentUser}
            showToast={showToast}
            onClose={() => setShowStocktake(false)}
          />
        </BottomSheet>
      )}
    </div>
  );
}
