import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { Home, Package, ArrowDownToLine, Bell, Users, ShoppingCart } from "lucide-react";
import { T, font } from "../constants/colors";
import { useTheme } from "../contexts/ThemeContext";
import { can, ROLE_META } from "../constants/permissions";
import { useToast } from "../hooks/useToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useStockActions } from "../hooks/useStockActions";
import { useOrderActions } from "../hooks/useOrderActions";
import { useCartActions } from "../hooks/useCartActions";
import { useSurgeryActions } from "../hooks/useSurgeryActions";

const HomeScreen      = lazy(() => import("./screens/HomeScreen").then(m => ({ default: m.HomeScreen })));
const InventoryScreen = lazy(() => import("./screens/InventoryScreen").then(m => ({ default: m.InventoryScreen })));
const InOutScreen     = lazy(() => import("./screens/InOutScreen").then(m => ({ default: m.InOutScreen })));
const AlertsScreen    = lazy(() => import("./screens/AlertsScreen").then(m => ({ default: m.AlertsScreen })));
const OrderScreen     = lazy(() => import("./screens/OrderScreen").then(m => ({ default: m.OrderScreen })));
const AdminScreen     = lazy(() => import("./screens/AdminScreen/AdminScreen").then(m => ({ default: m.AdminScreen })));
const ItemDetailScreen      = lazy(() => import("./screens/ItemDetailScreen").then(m => ({ default: m.ItemDetailScreen })));
const ExpiryManagementScreen = lazy(() => import("./screens/ExpiryManagementScreen").then(m => ({ default: m.ExpiryManagementScreen })));
const BarcodeScanScreen     = lazy(() => import("./screens/BarcodeScanScreen").then(m => ({ default: m.BarcodeScanScreen })));
const ProfileSheet          = lazy(() => import("./screens/ProfileSheet").then(m => ({ default: m.ProfileSheet })));

import { ItemPickerSheet } from "./modals/ItemPickerSheet";
import { InOutSheet } from "./modals/InOutSheet";
import { OrderRequestSheet } from "./modals/OrderRequestSheet";
import { ReceiptConfirmSheet } from "./modals/ReceiptConfirmSheet";
import { AddItemModal } from "./modals/AddItemModal";
import { EditItemModal } from "./modals/EditItemModal";
import { EditSurgeryItemsSheet } from "./modals/EditSurgeryItemsSheet";

export function MainApp({currentUser, users, setUsers, items, setItems, txs, setTxs, orders, setOrders, surgeries, setSurgeries, notifs, setNotifs, cart, setCart, unread, pendingOrders, onLogout}) {
  const [tab,     setTab]     = useState("home");
  const [modal,   setModal]   = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [form,    setForm]    = useState({qty:1, note:""});
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState(0);
  const [toast,   showToast]  = useToast();
  const [editItemsState, setEditItemsState] = useState(null);

  // 새 화면 상태
  const [detailItem,   setDetailItem]   = useState(null);
  const [showExpiry,   setShowExpiry]   = useState(false);
  const [showBarcode,  setShowBarcode]  = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  // iOS 뒤로쓸어넘기기 제스처 지원: 오버레이가 열릴 때 history entry 추가
  const overlayHistoryRef = useRef(false);

  const openDetail  = useCallback((item) => { window.history.pushState({overlay:true}, ''); overlayHistoryRef.current = true; setDetailItem(item); }, []);
  const openExpiry  = useCallback(() =>      { window.history.pushState({overlay:true}, ''); overlayHistoryRef.current = true; setShowExpiry(true); }, []);
  const openBarcode = useCallback(() =>      { window.history.pushState({overlay:true}, ''); overlayHistoryRef.current = true; setShowBarcode(true); }, []);
  const openProfile = useCallback(() =>      { window.history.pushState({overlay:true}, ''); overlayHistoryRef.current = true; setShowProfile(true); }, []);

  const closeOverlay = useCallback((closeFn) => {
    if (overlayHistoryRef.current) {
      overlayHistoryRef.current = false;
      window.history.back();
    } else {
      closeFn();
    }
  }, []);

  // popstate: 뒤로 제스처/버튼 → 열린 오버레이 닫기
  useEffect(() => {
    const onPop = () => {
      overlayHistoryRef.current = false;
      if      (detailItem)   setDetailItem(null);
      else if (showExpiry)   setShowExpiry(false);
      else if (showBarcode)  setShowBarcode(false);
      else if (showProfile)  setShowProfile(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [detailItem, showExpiry, showBarcode, showProfile]);

  const { tokens: dynamicT, mode, toggle } = useTheme();

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

  const filteredItems = useMemo(() => items.filter(i => i.name.includes(search) && (cat===0 || i.category_id===cat)), [items, search, cat]);

  // 하단 탭 — 알림 탭 제거, 5개만
  const navItems = [
    {id:"home",      Icon:Home,            label:"홈"},
    {id:"inventory", Icon:Package,         label:"재고"},
    {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
    {id:"order",     Icon:ShoppingCart,    label:"발주", badge:cart.length},
    ...(canApprove ? [{id:"admin", Icon:Users, label:"관리", badge:adminBadge}] : []),
  ];

  const tabTitles = {home:"대시보드", inventory:"재고 목록", inout:"입출고", order:"발주", alerts:"알림", admin:"관리"};

  // 바코드 스캔에서 품목 선택
  const handleBarcodeScan = ({item, type, qty}) => {
    setShowBarcode(false);
    openModal(type, item);
    setForm({qty, note:""});
  };

  return (
    <>
      {/* 헤더 — safe-area-inset-top으로 노치/Dynamic Island 회피 */}
      <div style={{background:dynamicT.white, paddingTop:"max(12px, env(safe-area-inset-top))", paddingBottom:14, paddingLeft:20, paddingRight:20, borderBottom:`1px solid ${dynamicT.grey100}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
              <p style={{margin:0, fontSize:12, color:dynamicT.grey400}}>DentalStock</p>
              <span style={{fontSize:11, fontWeight:600, color:ROLE_META[role].color, background:ROLE_META[role].bg, padding:"1px 8px", borderRadius:9999}}>{currentUser.name}</span>
            </div>
            <h1 style={{margin:0, fontSize:20, fontWeight:700, color:dynamicT.grey900}}>{tabTitles[tab] || "대시보드"}</h1>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:2}}>
            <button onClick={()=>setTab("alerts")} style={{position:"relative", background:"none", border:"none", cursor:"pointer", padding:8}}>
              <Bell size={22} color={dynamicT.grey700}/>
              {unread > 0 && <span style={{position:"absolute", top:4, right:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:10, fontWeight:700, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center"}}>{unread}</span>}
            </button>
            {/* 프로필 아바타 버튼 */}
            <button onClick={openProfile} style={{width:32, height:32, borderRadius:9999, border:"none", background:ROLE_META[role].bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:ROLE_META[role].color, fontFamily:font}}>
              {currentUser.name.slice(0,1)}
            </button>
          </div>
        </div>
      </div>

      {/* 화면 */}
      <div style={{flex:1, overflowY:"auto", background:dynamicT.grey50}}>
        <Suspense fallback={<div style={{padding:40, textAlign:"center", color:T.grey500, fontSize:13}}>로딩 중...</div>}>
          {tab==="home"      && <HomeScreen items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} openModal={openModal} currentUser={currentUser} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
          {tab==="inventory" && <InventoryScreen items={filteredItems} search={search} setSearch={setSearch} cat={cat} setCat={setCat} openModal={openModal} setItems={setItems} orders={orders} showToast={showToast} onItemClick={openDetail} onExpiryClick={openExpiry} onBarcodeClick={openBarcode}/>}
          {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
          {tab==="order"     && <OrderScreen cart={cart} allItems={items} orders={orders} currentUser={currentUser} updateCartQty={updateCartQty} removeFromCart={removeFromCart} submitCart={submitCart} clearCart={clearCart}/>}
          {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs}/>}
          {tab==="admin"     && canApprove && <AdminScreen users={users} setUsers={setUsers} currentUser={currentUser} orders={orders} items={items} txs={txs} surgeries={surgeries} addSurgery={addSurgery} onLogout={onLogout} approveOrder={approveOrder} rejectOrder={rejectOrder} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
        </Suspense>
      </div>

      {/* 하단 탭 — safe-area-inset-bottom으로 홈 인디케이터 회피 */}
      <div style={{background:dynamicT.white, borderTop:`1px solid ${dynamicT.grey100}`, display:"flex", paddingTop:6, paddingBottom:"max(18px, env(safe-area-inset-bottom))"}}>
        {navItems.map(({id,Icon,label,badge}) => {
          const a = tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", padding:"6px 0", position:"relative"}}>
              <Icon size={22} color={a?T.blue500:dynamicT.grey400} strokeWidth={a?2.5:1.8}/>
              <span style={{fontSize:10, fontFamily:font, color:a?T.blue500:dynamicT.grey400, fontWeight:a?700:400}}>{label}</span>
              {badge>0 && <span style={{position:"absolute", top:2, left:"50%", marginLeft:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:9, fontWeight:700, width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center"}}>{badge}</span>}
              {a && <div style={{position:"absolute", bottom:0, width:20, height:2, background:T.blue500, borderRadius:9999}}/>}
            </button>
          );
        })}
      </div>

      {/* 품목 상세 화면 (오버레이) */}
      {detailItem && (
        <div style={{position:"absolute", inset:0, zIndex:100, background:T.white}}>
          <Suspense fallback={null}>
            <ItemDetailScreen
              item={detailItem}
              txs={txs}
              orders={orders}
              onClose={()=>closeOverlay(()=>setDetailItem(null))}
              onIn={()=>openModal("in", detailItem)}
              onOut={()=>openModal("out", detailItem)}
              onOrder={()=>openModal("order_req", detailItem)}
            />
          </Suspense>
        </div>
      )}

      {/* 유통기한 관리 (오버레이) */}
      {showExpiry && (
        <div style={{position:"absolute", inset:0, zIndex:100, background:T.white}}>
          <Suspense fallback={null}>
            <ExpiryManagementScreen items={items} onClose={()=>closeOverlay(()=>setShowExpiry(false))} openModal={openModal}/>
          </Suspense>
        </div>
      )}

      {/* 바코드 스캔 */}
      {showBarcode && (
        <Suspense fallback={null}>
          <BarcodeScanScreen items={items} onSelect={handleBarcodeScan} onClose={()=>closeOverlay(()=>setShowBarcode(false))}/>
        </Suspense>
      )}

      {/* 프로필 시트 */}
      {showProfile && (
        <Suspense fallback={null}>
          <ProfileSheet currentUser={currentUser} onClose={()=>closeOverlay(()=>setShowProfile(false))} onLogout={onLogout}/>
        </Suspense>
      )}

      {/* 모달 */}
      {modal && (
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setModal(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
              <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
            </div>
            {(modal==="in"||modal==="out")&&!selItem&&<ItemPickerSheet items={items} setSelItem={setSelItem} onClose={()=>setModal(null)}/>}
            {(modal==="in"||modal==="out")&&selItem&&<InOutSheet modal={modal} selItem={selItem} form={form} setForm={setForm} onCommit={()=>commit(modal, selItem, form)} onClose={()=>setModal(null)}/>}
            {modal==="order_req"&&selItem&&<OrderRequestSheet item={selItem} currentUser={currentUser} onSubmit={submitOrder} onClose={()=>setModal(null)} orders={orders}/>}
            {modal==="confirm_receipt"&&selItem&&<ReceiptConfirmSheet item={selItem} orders={orders} currentUser={currentUser} onConfirm={confirmReceipt} onClose={()=>setModal(null)}/>}
            {modal==="add_item"&&<AddItemModal setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>}
            {modal==="edit_item"&&selItem&&<EditItemModal item={selItem} setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>}
          </div>
        </div>
      )}

      {/* 수술 준비 품목 편집 시트 */}
      {editItemsState && (
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setEditItemsState(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
              <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
            </div>
            <EditSurgeryItemsSheet
              initialItems={editItemsState.initialItems}
              allItems={items}
              title={editItemsState.title}
              onSave={editItemsState.onSave}
              onClose={()=>setEditItemsState(null)}
            />
          </div>
        </div>
      )}

      {toast && <div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight:400, zIndex:999, boxShadow:"0px 4px 12px rgba(0,0,0,0.12)", animation:"fadeUp 150ms"}}>{toast}</div>}
    </>
  );
}
