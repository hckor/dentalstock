import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { CalendarDays, Coins, Home, Package, ArrowDownToLine, ShoppingCart, Users } from "lucide-react";
import { T } from "../constants/colors";
import { useTheme } from "../contexts/ThemeContext";
import { can } from "../constants/permissions";
import { supabaseItemsApi } from "../api/supabaseItemsApi";
import { supabasePriceMonitorApi } from "../api/supabasePriceMonitorApi";
import { supabaseStaffApi } from "../api/supabaseStaffApi";
import { useToast } from "../hooks/useToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useStockActions } from "../hooks/useStockActions";
import { useOrderActions } from "../hooks/useOrderActions";
import { useSurgeryActions } from "../hooks/useSurgeryActions";
import { useOverlayHistory } from "../hooks/useOverlayHistory";
import { AppHeader } from "./layout/AppHeader";
import { BottomNav } from "./layout/BottomNav";
import { ModalRoot } from "./layout/ModalRoot";
import { OverlayRoot } from "./layout/OverlayRoot";

const HomeScreen           = lazy(() => import("./screens/HomeScreen").then(m => ({ default: m.HomeScreen })));
const InventoryScreen      = lazy(() => import("./screens/InventoryScreen").then(m => ({ default: m.InventoryScreen })));
const InOutScreen          = lazy(() => import("./screens/InOutScreen").then(m => ({ default: m.InOutScreen })));
const AlertsScreen         = lazy(() => import("./screens/AlertsScreen").then(m => ({ default: m.AlertsScreen })));
const ShippingTrackingScreen = lazy(() => import("./screens/ShippingTrackingScreen").then(m => ({ default: m.ShippingTrackingScreen })));
const AdminScreen          = lazy(() => import("./screens/AdminScreen/AdminScreen").then(m => ({ default: m.AdminScreen })));

export function MainApp({currentUser, users, setUsers, items, setItems, txs, setTxs, orders, setOrders, surgeries, setSurgeries, notifs, setNotifs, unread, onLogout}) {
  const [tab,     setTab]     = useState("home");
  const [modal,   setModal]   = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [form,    setForm]    = useState({qty:1, note:""});
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState(0);
  const [toast,   showToast]  = useToast();
  const [editItemsState, setEditItemsState] = useState(null);

  const [detailItem,  setDetailItem]  = useState(null);
  const [showExpiry,  setShowExpiry]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const overlayClosers = useMemo(() => [
    {isOpen: !!detailItem, close: () => setDetailItem(null)},
    {isOpen: showExpiry,   close: () => setShowExpiry(false)},
    {isOpen: showProfile,  close: () => setShowProfile(false)},
  ], [detailItem, showExpiry, showProfile]);

  const { open: openOverlay, close: closeOverlay } = useOverlayHistory(overlayClosers);

  const openDetail  = useCallback((item) => openOverlay(() => setDetailItem(item)), [openOverlay]);
  const openExpiry  = useCallback(() => openOverlay(() => setShowExpiry(true)),   [openOverlay]);
  const openProfile = useCallback(() => openOverlay(() => setShowProfile(true)),  [openOverlay]);

  const { tokens: dynamicT } = useTheme();

  const role       = currentUser.role;
  const canApprove = can(role, "orders_approve");

  const { firePush, requestPushPermission, firedRemindersRef } = usePushNotifications();
  const { commit } = useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });
  const { submitOrder, submitBulkOrders, approveOrder, approveOrders, rejectOrder, confirmReceipt, confirmReceipts, startTracking, refreshTracking } = useOrderActions({ orders, setOrders, items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });
  const { addSurgery, confirmSurgeryPrep, confirmSurgeryUsage, updateSurgeryItems, deleteSurgery } = useSurgeryActions({ surgeries, setSurgeries, items, setItems, setTxs, setNotifs, currentUser, showToast, firePush, firedRemindersRef });

  useEffect(() => { requestPushPermission(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = useCallback((type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); }, []);
  const openItemsEditor = useCallback((initialItems, onSave, title) => setEditItemsState({initialItems, onSave, title}), []);

  const updateStaffActive = useCallback(async (staff, nextActive) => {
    if (staff.id === currentUser.id && nextActive === false) {
      showToast("본인 계정은 비활성화할 수 없습니다");
      return;
    }

    try {
      if (supabaseStaffApi.isEnabled() && currentUser?.clinicId) {
        const updated = await supabaseStaffApi.setActive(staff.supabaseUserId || staff.id, nextActive);
        setUsers(prev => prev.map(user => user.id === staff.id ? {...user, ...updated} : user));
      } else {
        setUsers(prev => prev.map(user => user.id === staff.id ? {...user, active:nextActive} : user));
      }
      showToast(nextActive ? "직원을 활성화했습니다" : "직원을 비활성화했습니다");
    } catch (error) {
      showToast(error?.message?.includes("last active owner") ? "마지막 원장은 비활성화할 수 없습니다" : "직원 상태를 변경하지 못했습니다");
    }
  }, [currentUser, setUsers, showToast]);

  const updateStaffRole = useCallback(async (staff, nextRole) => {
    if (staff.role === nextRole) return;

    try {
      if (supabaseStaffApi.isEnabled() && currentUser?.clinicId) {
        const updated = await supabaseStaffApi.setRole(staff.supabaseUserId || staff.id, nextRole);
        setUsers(prev => prev.map(user => user.id === staff.id ? {...user, ...updated} : user));
      } else {
        setUsers(prev => prev.map(user => user.id === staff.id ? {...user, role:nextRole} : user));
      }
      showToast("직원 권한을 변경했습니다");
    } catch (error) {
      showToast(error?.message?.includes("last active owner") ? "마지막 원장 권한은 낮출 수 없습니다" : "직원 권한을 변경하지 못했습니다");
    }
  }, [currentUser, setUsers, showToast]);

  const inviteStaff = useCallback(async ({ email, name, role: nextRole }) => {
    try {
      if (!supabaseStaffApi.isEnabled() || !currentUser?.clinicId) {
        showToast("Supabase 모드에서만 직원 초대를 보낼 수 있습니다");
        return false;
      }

      const invited = await supabaseStaffApi.inviteStaff({ email, name, role: nextRole });
      setUsers(prev => {
        const exists = prev.some(user => user.id === invited.id);
        return exists
          ? prev.map(user => user.id === invited.id ? {...user, ...invited} : user)
          : [...prev, invited];
      });
      showToast("직원 초대 메일을 보냈습니다");
      return true;
    } catch (error) {
      const inviteErrorMessages = {
        authentication_required: "다시 로그인한 뒤 초대해주세요",
        invalid_email: "초대할 이메일을 확인해주세요",
        invite_delivery_unavailable: "Supabase 메일 발송 설정을 확인해주세요",
        invite_email_rate_limited: "메일 발송 제한 중입니다. 잠시 뒤 다시 시도해주세요",
        invite_redirect_invalid: "초대 링크 주소 설정을 확인해주세요",
        invite_failed: "초대 메일 발송에 실패했습니다",
        owner_required: "원장 계정만 직원을 초대할 수 있습니다",
        profile_create_failed: "직원 프로필 생성에 실패했습니다",
        server_not_configured: "Supabase Function secret 설정이 필요합니다",
        user_already_exists: "이미 가입되었거나 초대된 이메일입니다",
      };
      const message = inviteErrorMessages[error?.message] || "직원 초대를 보내지 못했습니다";
      showToast(message);
      return false;
    }
  }, [currentUser, setUsers, showToast]);

  const runPriceMonitor = useCallback(async (item = null) => {
    try {
      if (!supabasePriceMonitorApi.isEnabled() || !currentUser?.clinicId) {
        showToast("Supabase 모드에서만 가격 감시를 실행할 수 있습니다");
        return false;
      }
      if (item && !item.supabase_id) {
        showToast("서버에 저장된 품목만 가격 확인을 실행할 수 있습니다");
        return false;
      }

      const result = await supabasePriceMonitorApi.run({
        limit: item ? 10 : 30,
        itemId: item?.supabase_id || "",
      });
      const remoteItems = await supabaseItemsApi.listByClinic(currentUser.clinicId);
      if (remoteItems.length > 0) setItems(remoteItems);
      showToast(`${item ? "품목 가격 확인" : "가격 감시"} 완료 · 갱신 ${result.updated || 0}건`);
      return true;
    } catch (error) {
      const messages = {
        authentication_required: "다시 로그인한 뒤 실행해주세요",
        manager_required: "원장 또는 매니저만 가격 감시를 실행할 수 있습니다",
        products_load_failed: "구매 후보를 불러오지 못했습니다",
        products_sync_failed: "품목 구매 후보를 가격 감시 대상으로 동기화하지 못했습니다",
        server_not_configured: "가격 감시 서버 설정이 필요합니다",
      };
      showToast(messages[error?.message] || "가격 감시 실행에 실패했습니다");
      return false;
    }
  }, [currentUser, setItems, showToast]);

  const myOrders = orders.filter(o => o.requested_by === currentUser.name);
  const activeOrderCount = canApprove
    ? orders.filter(o => o.status === "pending" || o.status === "ordered").length
    : myOrders.filter(o => o.status === "pending" || o.status === "ordered").length;

  const adminSection = tab.startsWith("admin:") ? tab.slice("admin:".length) : null;
  const adminInitialTab = tab === "admin" ? "staff" : adminSection || "surgery";
  const navItems = role === "owner"
      ? [
          {id:"home",            Icon:Home,         label:"홈"},
          {id:"admin:analytics", Icon:Coins,        label:"비용"},
          {id:"admin:surgery",   Icon:CalendarDays, label:"수술"},
          {id:"inventory",       Icon:Package,      label:"재고"},
          {id:"admin",           Icon:Users,        label:"관리"},
        ]
    : role === "manager"
      ? [
          {id:"home",        Icon:Home,         label:"홈"},
          {id:"shipping",    Icon:ShoppingCart, label:"승인", badge:activeOrderCount},
          {id:"inventory",   Icon:Package,      label:"재고"},
          {id:"admin",       Icon:Users,        label:"관리"},
        ]
      : [
          {id:"home",      Icon:CalendarDays,    label:"수술"},
          {id:"inventory", Icon:Package,         label:"재고"},
          {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
          {id:"shipping",  Icon:ShoppingCart,    label:"발주", badge:activeOrderCount},
        ];

  return (
    <>
      <AppHeader
        tab={tab}
        currentUser={currentUser}
        unread={unread}
        setTab={setTab}
        onOpenProfile={openProfile}
      />

      <div style={{flex:1, overflowY:"auto", background:dynamicT.grey50}}>
        <Suspense fallback={<div style={{padding:40, textAlign:"center", color:T.grey500, fontSize: 16}}>로딩 중...</div>}>
          {tab==="home"      && <HomeScreen currentUser={currentUser} users={users} items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} openModal={openModal} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} confirmSurgeryUsage={confirmSurgeryUsage} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
          {tab==="inventory" && <InventoryScreen items={items} search={search} setSearch={setSearch} cat={cat} setCat={setCat} orders={orders} currentUser={currentUser} onItemClick={openDetail} onExpiryClick={openExpiry} onBulkOrderClick={()=>openModal("bulk_order")}/>}
          {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
          {tab==="shipping"  && <ShippingTrackingScreen orders={orders} allItems={items} currentUser={currentUser} canApprove={canApprove} openModal={openModal} showToast={showToast} approveOrder={approveOrder} approveOrders={approveOrders} rejectOrder={rejectOrder} startTracking={startTracking} refreshTracking={refreshTracking} confirmReceipt={confirmReceipt} onRunPriceMonitor={runPriceMonitor}/>}
          {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs} setTab={setTab}/>}
          {(tab==="admin" || adminSection) && canApprove && <AdminScreen key={adminInitialTab} initialTab={adminInitialTab} standalone={Boolean(adminSection)} managementOnly={tab === "admin"} users={users} currentUser={currentUser} orders={orders} items={items} setItems={setItems} setTxs={setTxs} txs={txs} surgeries={surgeries} addSurgery={addSurgery} deleteSurgery={deleteSurgery} onLogout={onLogout} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems} openModal={openModal} showToast={showToast} onInviteStaff={inviteStaff} onRunPriceMonitor={runPriceMonitor} onStaffActiveChange={updateStaffActive} onStaffRoleChange={updateStaffRole}/>}
        </Suspense>
      </div>

      <BottomNav tab={tab} setTab={setTab} items={navItems}/>

      <OverlayRoot
        detailItem={detailItem}
        showExpiry={showExpiry}
        showProfile={showProfile}
        items={items}
        txs={txs}
        orders={orders}
        currentUser={currentUser}
        canEdit={canApprove}
        onCloseDetail={()=>closeOverlay(()=>setDetailItem(null))}
        onCloseExpiry={()=>closeOverlay(()=>setShowExpiry(false))}
        onCloseProfile={()=>closeOverlay(()=>setShowProfile(false))}
        openModal={openModal}
        onLogout={onLogout}
      />

      <ModalRoot
        modal={modal} setModal={setModal}
        selItem={selItem} setSelItem={setSelItem}
        form={form} setForm={setForm}
        items={items} setItems={setItems}
        orders={orders} currentUser={currentUser}
        commit={commit} submitOrder={submitOrder} submitBulkOrders={submitBulkOrders} confirmReceipt={confirmReceipt} confirmReceipts={confirmReceipts}
        showToast={showToast}
        canApprove={canApprove}
        editItemsState={editItemsState} setEditItemsState={setEditItemsState}
        openModal={openModal}
      />

      {toast && (
        <div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize: 14, fontWeight:500, zIndex:999, boxShadow:T.shadowToast, animation:"fadeUp 150ms"}}>
          {toast}
        </div>
      )}
    </>
  );
}
