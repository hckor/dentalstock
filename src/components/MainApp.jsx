import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { Home, Package, ArrowDownToLine, ShoppingCart, Users } from "lucide-react";
import { T } from "../constants/colors";
import { useTheme } from "../contexts/ThemeContext";
import { can } from "../constants/permissions";
import { useToast } from "../hooks/useToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useStockActions } from "../hooks/useStockActions";
import { useOrderActions } from "../hooks/useOrderActions";
import { useCartActions } from "../hooks/useCartActions";
import { useSurgeryActions } from "../hooks/useSurgeryActions";
import { useOverlayHistory } from "../hooks/useOverlayHistory";
import { AppHeader } from "./layout/AppHeader";
import { BottomNav } from "./layout/BottomNav";
import { ModalRoot } from "./layout/ModalRoot";
import { OverlayRoot } from "./layout/OverlayRoot";

const HomeScreen      = lazy(() => import("./screens/HomeScreen").then(m => ({ default: m.HomeScreen })));
const InventoryScreen = lazy(() => import("./screens/InventoryScreen").then(m => ({ default: m.InventoryScreen })));
const InOutScreen     = lazy(() => import("./screens/InOutScreen").then(m => ({ default: m.InOutScreen })));
const AlertsScreen    = lazy(() => import("./screens/AlertsScreen").then(m => ({ default: m.AlertsScreen })));
const OrderScreen     = lazy(() => import("./screens/OrderScreen").then(m => ({ default: m.OrderScreen })));
const AdminScreen     = lazy(() => import("./screens/AdminScreen/AdminScreen").then(m => ({ default: m.AdminScreen })));

export function MainApp({currentUser, users, setUsers, items, setItems, txs, setTxs, orders, setOrders, surgeries, setSurgeries, notifs, setNotifs, cart, setCart, unread, pendingOrders, onLogout}) {
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
  const [showBarcode, setShowBarcode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const overlayClosers = useMemo(() => [
    {isOpen: !!detailItem, close: () => setDetailItem(null)},
    {isOpen: showExpiry,   close: () => setShowExpiry(false)},
    {isOpen: showBarcode,  close: () => setShowBarcode(false)},
    {isOpen: showProfile,  close: () => setShowProfile(false)},
  ], [detailItem, showExpiry, showBarcode, showProfile]);

  const { open: openOverlay, close: closeOverlay } = useOverlayHistory(overlayClosers);

  const openDetail  = useCallback((item) => openOverlay(() => setDetailItem(item)), [openOverlay]);
  const openExpiry  = useCallback(() => openOverlay(() => setShowExpiry(true)),   [openOverlay]);
  const openBarcode = useCallback(() => openOverlay(() => setShowBarcode(true)),  [openOverlay]);
  const openProfile = useCallback(() => openOverlay(() => setShowProfile(true)),  [openOverlay]);

  const { tokens: dynamicT } = useTheme();

  const role       = currentUser.role;
  const canApprove = can(role, "orders_approve");
  const adminBadge = canApprove ? pendingOrders : 0;

  const { firePush, requestPushPermission, firedRemindersRef } = usePushNotifications();
  const { commit } = useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });
  const { submitOrder, approveOrder, rejectOrder, confirmReceipt } = useOrderActions({ orders, setOrders, items, setItems, cart, setCart, setTxs, setNotifs, currentUser, showToast, setModal });
  const { updateCartQty, removeFromCart, clearCart, submitCart } = useCartActions({ cart, setCart, orders, setOrders, setNotifs, items, currentUser, showToast, setTab });
  const { addSurgery, confirmSurgeryPrep, updateSurgeryItems } = useSurgeryActions({ surgeries, setSurgeries, setNotifs, currentUser, showToast, firePush, firedRemindersRef });

  useEffect(() => { requestPushPermission(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = useCallback((type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); }, []);
  const openItemsEditor = useCallback((initialItems, onSave, title) => setEditItemsState({initialItems, onSave, title}), []);

  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(search) && (cat===0 || i.category_id===cat)),
    [items, search, cat]
  );

  const navItems = [
    {id:"home",      Icon:Home,            label:"홈"},
    {id:"inventory", Icon:Package,         label:"재고"},
    {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
    {id:"order",     Icon:ShoppingCart,    label:"발주", badge:cart.length},
    ...(canApprove ? [{id:"admin", Icon:Users, label:"관리", badge:adminBadge}] : []),
  ];

  const handleBarcodeScan = ({item, type, qty}) => {
    setShowBarcode(false);
    openModal(type, item);
    setForm({qty, note:""});
  };

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
        <Suspense fallback={<div style={{padding:40, textAlign:"center", color:T.grey500, fontSize:13}}>로딩 중...</div>}>
          {tab==="home"      && <HomeScreen items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
          {tab==="inventory" && <InventoryScreen items={filteredItems} search={search} setSearch={setSearch} cat={cat} setCat={setCat} openModal={openModal} setItems={setItems} orders={orders} showToast={showToast} onItemClick={openDetail} onExpiryClick={openExpiry} onBarcodeClick={openBarcode}/>}
          {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
          {tab==="order"     && <OrderScreen cart={cart} allItems={items} orders={orders} currentUser={currentUser} updateCartQty={updateCartQty} removeFromCart={removeFromCart} submitCart={submitCart} clearCart={clearCart}/>}
          {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs}/>}
          {tab==="admin"     && canApprove && <AdminScreen users={users} setUsers={setUsers} currentUser={currentUser} orders={orders} items={items} txs={txs} surgeries={surgeries} addSurgery={addSurgery} onLogout={onLogout} approveOrder={approveOrder} rejectOrder={rejectOrder} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
        </Suspense>
      </div>

      <BottomNav tab={tab} setTab={setTab} items={navItems}/>

      <OverlayRoot
        detailItem={detailItem}
        showExpiry={showExpiry}
        showBarcode={showBarcode}
        showProfile={showProfile}
        items={items}
        txs={txs}
        orders={orders}
        currentUser={currentUser}
        onCloseDetail={()=>closeOverlay(()=>setDetailItem(null))}
        onCloseExpiry={()=>closeOverlay(()=>setShowExpiry(false))}
        onCloseBarcode={()=>closeOverlay(()=>setShowBarcode(false))}
        onCloseProfile={()=>closeOverlay(()=>setShowProfile(false))}
        openModal={openModal}
        onLogout={onLogout}
        onBarcodeSelect={handleBarcodeScan}
      />

      <ModalRoot
        modal={modal} setModal={setModal}
        selItem={selItem} setSelItem={setSelItem}
        form={form} setForm={setForm}
        items={items} setItems={setItems}
        orders={orders} currentUser={currentUser}
        commit={commit} submitOrder={submitOrder} confirmReceipt={confirmReceipt}
        showToast={showToast}
        editItemsState={editItemsState} setEditItemsState={setEditItemsState}
      />

      {toast && (
        <div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight:400, zIndex:999, boxShadow:"0px 4px 12px rgba(0,0,0,0.12)", animation:"fadeUp 150ms"}}>
          {toast}
        </div>
      )}
    </>
  );
}
