import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { Home, Package, ArrowDownToLine, ShoppingCart, Users } from "lucide-react";
import { T } from "../constants/colors";
import { useTheme } from "../contexts/ThemeContext";
import { can } from "../constants/permissions";
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

export function MainApp({currentUser, users, setUsers, items, setItems, txs, setTxs, orders, setOrders, surgeries, setSurgeries, notifs, setNotifs, unread, pendingOrders, onLogout}) {
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
  const adminBadge = canApprove ? pendingOrders : 0;

  const { firePush, requestPushPermission, firedRemindersRef } = usePushNotifications();
  const { commit } = useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });
  const { submitOrder, approveOrder, rejectOrder, confirmReceipt, startTracking, refreshTracking } = useOrderActions({ orders, setOrders, items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });
  const { addSurgery, confirmSurgeryPrep, updateSurgeryItems, deleteSurgery } = useSurgeryActions({ surgeries, setSurgeries, setNotifs, currentUser, showToast, firePush, firedRemindersRef });

  useEffect(() => { requestPushPermission(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = useCallback((type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); }, []);
  const openItemsEditor = useCallback((initialItems, onSave, title) => setEditItemsState({initialItems, onSave, title}), []);

  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(search) && (cat===0 || i.category_id===cat)),
    [items, search, cat]
  );

  const myOrders = orders.filter(o => o.requested_by === currentUser.name);
  const activeOrderCount = canApprove
    ? orders.filter(o => o.status === "pending" || o.status === "ordered").length
    : myOrders.filter(o => o.status === "pending" || o.status === "ordered").length;

  const navItems = [
    {id:"home",      Icon:Home,            label:"홈"},
    {id:"inventory", Icon:Package,         label:"재고"},
    {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
    {id:"shipping",  Icon:ShoppingCart,    label:"발주/배송", badge:activeOrderCount},
    ...(canApprove ? [{id:"admin", Icon:Users, label:"관리", badge:adminBadge}] : []),
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
          {tab==="home"      && <HomeScreen items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
          {tab==="inventory" && <InventoryScreen items={filteredItems} search={search} setSearch={setSearch} cat={cat} setCat={setCat} orders={orders} onItemClick={openDetail} onExpiryClick={openExpiry}/>}
          {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
          {tab==="shipping"  && <ShippingTrackingScreen orders={orders} allItems={items} currentUser={currentUser} canApprove={canApprove} openModal={openModal} showToast={showToast} approveOrder={approveOrder} rejectOrder={rejectOrder} startTracking={startTracking} refreshTracking={refreshTracking} confirmReceipt={confirmReceipt}/>}
          {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs} setTab={setTab}/>}
          {tab==="admin"     && canApprove && <AdminScreen users={users} setUsers={setUsers} currentUser={currentUser} orders={orders} items={items} setItems={setItems} txs={txs} surgeries={surgeries} addSurgery={addSurgery} deleteSurgery={deleteSurgery} onLogout={onLogout} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems} openModal={openModal} showToast={showToast}/>}
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
        commit={commit} submitOrder={submitOrder} confirmReceipt={confirmReceipt}
        showToast={showToast}
        canApprove={canApprove}
        editItemsState={editItemsState} setEditItemsState={setEditItemsState}
        openModal={openModal}
      />

      {toast && (
        <div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize: 14, fontWeight:500, zIndex:999, boxShadow:"0px 4px 12px rgba(0,0,0,0.12)", animation:"fadeUp 150ms"}}>
          {toast}
        </div>
      )}
    </>
  );
}
