import { useState, useEffect } from "react";
import { Home, Package, ArrowDownToLine, Bell, Users, LogOut, ShoppingCart } from "lucide-react";
import { T, font } from "../constants/colors";
import { can, ROLE_META } from "../constants/permissions";
import { useToast } from "../hooks/useToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useStockActions } from "../hooks/useStockActions";
import { useOrderActions } from "../hooks/useOrderActions";
import { useCartActions } from "../hooks/useCartActions";
import { useSurgeryActions } from "../hooks/useSurgeryActions";
import { HomeScreen } from "./screens/HomeScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { InOutScreen } from "./screens/InOutScreen";
import { AlertsScreen } from "./screens/AlertsScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { AdminScreen } from "./screens/AdminScreen/AdminScreen";
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

  const role       = currentUser.role;
  const canApprove = can(role, "orders_approve");
  const adminBadge = canApprove ? pendingOrders : 0;

  const { firePush, requestPushPermission, firedRemindersRef } = usePushNotifications();

  const { commit } = useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });

  const { submitOrder, approveOrder, rejectOrder, confirmReceipt } = useOrderActions({ orders, setOrders, items, setItems, cart, setCart, setTxs, setNotifs, currentUser, showToast, setModal });

  const { updateCartQty, removeFromCart, clearCart, submitCart } = useCartActions({ cart, setCart, orders, setOrders, setNotifs, items, currentUser, showToast, setTab });

  const { addSurgery, confirmSurgeryPrep, updateSurgeryItems } = useSurgeryActions({ surgeries, setSurgeries, setNotifs, currentUser, showToast, firePush, firedRemindersRef });

  // ── 로그인 직후: 브라우저 푸쉬 권한 요청 ──
  // (당일 수술 알림 useEffect는 useSurgeryActions 내부로 이동)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { requestPushPermission(); }, []);

  const openModal = (type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); };

  const openItemsEditor = (initialItems, onSave, title) =>
    setEditItemsState({initialItems, onSave, title});

  const filteredItems = items.filter(i=>i.name.includes(search)&&(cat===0||i.category_id===cat));
  const navItems = [
    {id:"home",      Icon:Home,            label:"홈"},
    {id:"inventory", Icon:Package,         label:"재고"},
    {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
    {id:"order",     Icon:ShoppingCart,    label:"발주", badge:cart.length},
    {id:"alerts",    Icon:Bell,            label:"알림", badge:unread},
    ...(canApprove?[{id:"admin", Icon:Users, label:"관리", badge:adminBadge}]:[]),
  ];

  return (
    <>
      {/* 상태바 */}
      <div style={{background:T.white, padding:"14px 24px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T.grey100}`}}>
        <span style={{fontSize:13, fontWeight:700, color:T.grey900}}>9:41</span>
        <div style={{width:110, height:24, background:T.grey900, borderRadius:12}}/>
        <span style={{fontSize:12, color:T.grey600}}>100%</span>
      </div>
      {/* 헤더 */}
      <div style={{background:T.white, padding:"12px 20px 14px", borderBottom:`1px solid ${T.grey100}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:2}}>
              <p style={{margin:0, fontSize:12, color:T.grey400}}>DentalStock</p>
              <span style={{fontSize:11, fontWeight:600, color:ROLE_META[role].color, background:ROLE_META[role].bg, padding:"1px 8px", borderRadius:9999}}>{currentUser.name}</span>
            </div>
            <h1 style={{margin:0, fontSize:20, fontWeight:700, color:T.grey900}}>
              {{home:"대시보드",inventory:"재고 목록",inout:"입출고",order:"발주",alerts:"알림",admin:"관리"}[tab]}
            </h1>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:4}}>
            <button onClick={()=>setTab("alerts")} style={{position:"relative", background:"none", border:"none", cursor:"pointer", padding:8}}>
              <Bell size={22} color={T.grey700}/>
              {unread>0&&<span style={{position:"absolute", top:4, right:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:10, fontWeight:700, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center"}}>{unread}</span>}
            </button>
            <button
              aria-label="로그아웃"
              onClick={()=>{ if (window.confirm("로그아웃 하시겠습니까?")) onLogout(); }}
              style={{background:"none", border:"none", cursor:"pointer", padding:8}}>
              <LogOut size={20} color={T.grey700}/>
            </button>
          </div>
        </div>
      </div>

      {/* 화면 */}
      <div style={{flex:1, overflowY:"auto", background:T.grey50}}>
        {tab==="home"      && <HomeScreen items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} openModal={openModal} currentUser={currentUser} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
        {tab==="inventory" && <InventoryScreen items={filteredItems} search={search} setSearch={setSearch} cat={cat} setCat={setCat} openModal={openModal} setItems={setItems} orders={orders} showToast={showToast}/>}
        {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
        {tab==="order"     && <OrderScreen cart={cart} allItems={items} orders={orders} currentUser={currentUser} updateCartQty={updateCartQty} removeFromCart={removeFromCart} submitCart={submitCart} clearCart={clearCart}/>}
        {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs}/>}
        {tab==="admin"     && canApprove && <AdminScreen users={users} setUsers={setUsers} currentUser={currentUser} orders={orders} items={items} txs={txs} surgeries={surgeries} addSurgery={addSurgery} onLogout={onLogout} approveOrder={approveOrder} rejectOrder={rejectOrder} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
      </div>

      {/* 하단 탭 */}
      <div style={{background:T.white, borderTop:`1px solid ${T.grey100}`, display:"flex", padding:"6px 0 18px"}}>
        {navItems.map(({id,Icon,label,badge}) => {
          const a = tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", padding:"6px 0", position:"relative"}}>
              <Icon size={22} color={a?T.blue500:T.grey400} strokeWidth={a?2.5:1.8}/>
              <span style={{fontSize:10, fontFamily:font, color:a?T.blue500:T.grey400, fontWeight:a?700:400}}>{label}</span>
              {badge>0&&<span style={{position:"absolute", top:4, left:"50%", marginLeft:6, background:T.red500, color:T.white, borderRadius:9999, fontSize:9, fontWeight:700, width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center"}}>{badge}</span>}
              {a&&<div style={{position:"absolute", bottom:0, width:20, height:2, background:T.blue500, borderRadius:9999}}/>}
            </button>
          );
        })}
      </div>

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

      {toast&&<div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight:400, zIndex:999, boxShadow:"0px 4px 12px rgba(0,0,0,0.12)", animation:"fadeUp 150ms"}}>{toast}</div>}
    </>
  );
}
