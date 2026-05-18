import { useState, useEffect, useRef } from "react";
import { Home, Package, ArrowDownToLine, Bell, Users, LogOut, ShoppingCart } from "lucide-react";
import { T, font } from "../constants/colors";
import { can, ROLE_META } from "../constants/permissions";
import { SURGERY_PRESETS } from "../constants/surgeryPresets";
import { getActiveOrder, todayKey } from "../utils/helpers";
import { useToast } from "../hooks/useToast";
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
  const firedPushesRef    = useRef(new Set());
  const firedRemindersRef = useRef(new Set());

  const role       = currentUser.role;
  const canApprove = can(role, "orders_approve");
  const adminBadge = canApprove ? pendingOrders : 0;

  const openModal = (type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); };

  const openItemsEditor = (initialItems, onSave, title) =>
    setEditItemsState({initialItems, onSave, title});

  const updateSurgeryItems = (surgeryId, newItems) => {
    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, required_items:newItems}:s));
    showToast("준비 품목이 수정되었습니다.");
  };

  const requestPushPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(()=>{});
    }
  };
  const firePush = (key, title, body) => {
    if (firedPushesRef.current.has(key)) return;
    firedPushesRef.current.add(key);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, {body, tag:key}); } catch { /* push silently fails */ }
    }
  };

  // ── 입출고 처리 ─────────────────────────────────────
  const commit = type => {
    if (!selItem) return;
    const requestedQty = Math.max(1, parseInt(form.qty)||1);
    const qty   = type==="out" ? Math.min(requestedQty, selItem.current_qty) : requestedQty;
    if (type==="out" && qty < requestedQty) {
      showToast(`현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`);
    }
    if (type==="out" && qty === 0) return;
    const after = type==="in" ? selItem.current_qty+qty : selItem.current_qty-qty;
    const upd   = items.map(i=>i.id===selItem.id?{...i,current_qty:after}:i);
    setItems(upd);
    setTxs(p=>[{id:`t${Date.now()}`, item_id:selItem.id, type, qty, note:form.note, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    const u = upd.find(i=>i.id===selItem.id);
    if (u.current_qty < u.min_qty)
      setNotifs(p=>[{id:`n${Date.now()}`, type:"low_stock", item_id:selItem.id, message:`${selItem.name} 재고가 부족합니다`, sub:`현재 ${u.current_qty}${selItem.unit} · 최소 ${selItem.min_qty}${selItem.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
    setModal(null);
  };

  // ── 발주 요청 → 장바구니 담기 ───────────────────────
  const submitOrder = (item, qty, note) => {
    if (getActiveOrder(orders, item.id)) {
      showToast("이미 진행 중인 발주가 있습니다.");
      setModal(null);
      return;
    }
    if (cart.some(c => c.item_id === item.id)) {
      showToast("이미 장바구니에 담긴 품목입니다.");
      setModal(null);
      return;
    }
    setCart(p => [...p, { item_id: item.id, qty, note }]);
    showToast(`${item.name} 장바구니에 담았어요`);
    setModal(null);
  };

  const updateCartQty = (itemId, qty) => {
    setCart(p => p.map(c => c.item_id === itemId ? { ...c, qty } : c));
  };

  const removeFromCart = (itemId) => {
    setCart(p => p.filter(c => c.item_id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm("장바구니를 모두 비우시겠습니까?")) return;
    setCart([]);
    showToast("장바구니를 비웠어요");
  };

  // ── 장바구니 일괄 발주 요청 ─────────────────────────
  const submitCart = () => {
    if (cart.length === 0) return;
    // 진행 중인 발주가 생긴 품목은 자동 제외
    const valid = cart.filter(c => !getActiveOrder(orders, c.item_id));
    const skipped = cart.length - valid.length;
    if (valid.length === 0) {
      showToast("이미 진행 중인 발주만 있어요");
      return;
    }
    const now = new Date().toISOString();
    const newOrders = valid.map((c, i) => ({
      id: `o${Date.now()}-${i}`,
      item_id: c.item_id,
      requested_by: currentUser.name,
      requested_at: now,
      qty: c.qty,
      note: c.note,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_note: "",
    }));
    const newNotifs = valid.map((c, i) => {
      const item = items.find(it => it.id === c.item_id);
      return {
        id: `n${Date.now()}-${i}`,
        type: "order_req",
        item_id: c.item_id,
        message: `${item?.name} 발주 요청이 도착했습니다`,
        sub: `${currentUser.name} · ${c.qty}${item?.unit || ""}`,
        is_read: false,
        created_at: now,
      };
    });
    setOrders(p => [...newOrders, ...p]);
    setNotifs(p => [...newNotifs, ...p]);
    setCart([]);
    showToast(`${valid.length}건 발주 요청 완료${skipped > 0 ? ` (${skipped}건 자동 제외)` : ""}`);
    setTab("home");
  };

  // ── 발주 승인 (ordered 상태로, 재고 반영 없음) ────────
  const approveOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"ordered", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"ordered", item_id:item.id, message:`${item.name} 발주가 완료되었습니다`, sub:`${currentUser.name} 승인 · ${order.qty}${item.unit} 배송 대기`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주가 승인되었습니다.");
  };

  // ── 발주 거절 ────────────────────────────────────────
  const rejectOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"rejected", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"order_rejected", item_id:item.id, message:`${item.name} 발주가 거절되었습니다`, sub:`${currentUser.name} · ${reviewNote||"사유 없음"}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주 요청이 거절되었습니다");
  };

  // ── 실 입고 확인 (ordered → received, 재고 반영) ──────
  const confirmReceipt = (orderId, actualQty, note) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "ordered") {
      showToast("입고 확인할 발주를 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("입고 품목을 찾을 수 없습니다.");
      return;
    }
    const after = item.current_qty + actualQty;
    setItems(p=>p.map(i=>i.id===item.id?{...i, current_qty:after}:i));
    setTxs(p=>[{id:`t${Date.now()}`, item_id:item.id, type:"in", qty:actualQty, note:`발주 입고 확인 (요청자: ${order.requested_by})${note?` · ${note}`:""}`, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"received"}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"received", item_id:item.id, message:`${item.name} 입고 확인 완료`, sub:`${currentUser.name} 확인 · ${actualQty}${item.unit} 입고`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${actualQty}${item.unit} 입고 확인 완료`);
    setModal(null);
  };

  const addSurgery = (data) => {
    const preset = SURGERY_PRESETS[data.type] || SURGERY_PRESETS.implant;
    const requiredItems = (data.required_items && data.required_items.length) ? data.required_items : preset.items;
    const surgery = {
      id:`s${Date.now()}`,
      title:data.title || preset.label,
      patient:data.patient || "-",
      type:data.type,
      scheduled_date:data.scheduled_date,
      scheduled_time:data.scheduled_time,
      note:data.note,
      required_items:requiredItems,
      created_by:currentUser.name,
      prep_confirmed:false,
      prepared_by:null,
      prepared_at:null,
    };
    setSurgeries(p=>[surgery,...p]);
    if (surgery.scheduled_date===todayKey()) {
      setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_today", surgery_id:surgery.id, item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:`${surgery.title} · ${surgery.scheduled_time}`, is_read:false, created_at:new Date().toISOString()},...p]);
      firePush(`today:${surgery.id}`, "오늘 수술 일정", `${surgery.title} · ${surgery.scheduled_time}`);
    }
    showToast("수술 일정이 등록되었습니다.");
  };

  const confirmSurgeryPrep = (surgeryId) => {
    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;
    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, prep_confirmed:true, prepared_by:currentUser.name, prepared_at:new Date().toISOString()}:s));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_ready", surgery_id:surgeryId, item_id:null, message:"수술 준비 확인이 완료되었습니다", sub:`${surgery.title} · ${currentUser.name}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("수술 준비가 확인되었습니다.");
  };

  // ── 로그인 직후: 브라우저 푸쉬 권한 요청 + 당일 수술 인앱 알림 자동 생성 ──
  useEffect(() => {
    requestPushPermission();
    const today = todayKey();
    const todays = surgeries.filter(s=>s.scheduled_date===today);
    if (todays.length === 0) return;
    setNotifs(p => {
      const existing = new Set(p.filter(n=>n.type==="surgery_today"&&n.surgery_id).map(n=>n.surgery_id));
      const missing = todays.filter(s=>!existing.has(s.id));
      if (missing.length === 0) return p;
      const created = missing.map(s=>({
        id:`n${Date.now()}-${s.id}`, type:"surgery_today", surgery_id:s.id, item_id:null,
        message:"오늘 예정된 수술 준비가 필요합니다",
        sub:`${s.title} · ${s.scheduled_time}`,
        is_read:false, created_at:new Date().toISOString(),
      }));
      return [...created, ...p];
    });
    todays.forEach(s => firePush(`today:${s.id}`, "오늘 수술 일정", `${s.title} · ${s.scheduled_time}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 30분 전 미준비 리마인더 ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      surgeries.forEach(s => {
        if (s.prep_confirmed) return;
        if (s.scheduled_date !== todayKey()) return;
        const start = new Date(`${s.scheduled_date}T${s.scheduled_time}`);
        const diffMin = (start - now) / 60000;
        if (diffMin > 0 && diffMin <= 30 && !firedRemindersRef.current.has(s.id)) {
          firedRemindersRef.current.add(s.id);
          const mins = Math.ceil(diffMin);
          setNotifs(p => [{
            id:`n${Date.now()}-r${s.id}`, type:"surgery_reminder", surgery_id:s.id, item_id:null,
            message:`${mins}분 후 수술 시작 — 준비 미완료`,
            sub:`${s.title} · ${s.scheduled_time}`,
            is_read:false, created_at:new Date().toISOString(),
          }, ...p]);
          firePush(`reminder:${s.id}`, "수술 임박 — 준비 미완료", `${s.title} · ${s.scheduled_time}`);
        }
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surgeries]);

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
            {(modal==="in"||modal==="out")&&selItem&&<InOutSheet modal={modal} selItem={selItem} form={form} setForm={setForm} onCommit={()=>commit(modal)} onClose={()=>setModal(null)}/>}
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
