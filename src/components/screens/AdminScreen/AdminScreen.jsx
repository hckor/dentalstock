import { useState } from "react";
import { LogOut, RotateCcw, ClipboardList, PackagePlus } from "lucide-react";
import { resetToInitial } from "../../../api/seed";
import { T, font, monoFont } from "../../../constants/colors";
import { ROLE_META } from "../../../constants/permissions";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Avatar } from "../../shared/Avatar";
import { AnalyticsTab } from "./AnalyticsTab";
import { SurgeryAdminTab } from "./SurgeryAdminTab";
import { VendorSettingsTab } from "./VendorSettingsTab";
import { BottomSheet } from "../../shared/BottomSheet";
import { InitialInventoryModal } from "../../modals/InitialInventoryModal";

export function AdminScreen({users, setUsers, currentUser, orders, items, setItems, txs, surgeries, addSurgery, deleteSurgery, onLogout, openItemsEditor, updateSurgeryItems, openModal, showToast}) {
  const [adminTab, setAdminTab] = useState("surgery");
  const [showInitialInventory, setShowInitialInventory] = useState(false);

  const handleInitialInventorySave = (quantities) => {
    setItems(prev => prev.map(item =>
      quantities[item.id] !== undefined
        ? { ...item, current_qty: quantities[item.id] }
        : item
    ));
  };

  const tabs = [
    {id:"surgery",   label:"수술 준비"},
    {id:"analytics", label:"소비 분석"},
    {id:"staff",     label:"직원 관리"},
    {id:"items",     label:"품목 관리"},
    {id:"vendor",    label:"도매 설정"},
  ];

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column"}}>
      {/* 서브탭 */}
      <div style={{background:T.white, borderBottom:`1px solid ${T.grey200}`, padding:"10px 16px"}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:6}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setAdminTab(t.id)}
              style={{minHeight:40, padding:"10px 12px", border:"none", borderRadius:12, cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:700,
                background:adminTab===t.id ? T.blue50 : T.grey100,
                color:adminTab===t.id ? T.blue500 : T.grey600,
                boxShadow:adminTab===t.id ? "0px 2px 4px rgba(0,0,0,0.06)" : "none",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all 150ms", whiteSpace:"nowrap"}}>
              {t.label}
              {t.badge>0 && (
                <span style={{background:adminTab===t.id?T.red500:T.red500, color:T.white, borderRadius:9999, fontSize: 12, fontWeight:700, padding:"1px 6px"}}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
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

            <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:600, color:T.grey600}}>직원 목록</p>
            <Card style={{marginBottom:16}}>
              {users.map((u, i) => {
                const m    = ROLE_META[u.role];
                const isMe = u.id === currentUser.id;
                return (
                  <div key={u.id}>
                    <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px", opacity:u.active?1:0.45}}>
                      <Avatar name={u.name} role={u.role} size={40}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex", alignItems:"center", gap:6}}>
                          <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{u.name}</p>
                          {isMe && <span style={{fontSize: 12, fontWeight:700, color:T.blue500, background:T.blue50, padding:"1px 6px", borderRadius:9999}}>나</span>}
                        </div>
                        <span style={{fontSize: 16, fontWeight:600, color:m.color}}>{m.label}</span>
                      </div>
                      {!isMe && (
                        <button onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x))}
                          style={{padding:"12px 18px", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize: 16, fontWeight:600, background:u.active?T.red50:T.green50, color:u.active?T.red500:T.green500}}>
                          {u.active?"비활성":"활성화"}
                        </button>
                      )}
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

        {adminTab === "vendor" && <VendorSettingsTab showToast={showToast}/>}
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
