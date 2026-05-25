import { useState } from "react";
import { History, Store, Tags, Truck, UsersRound } from "lucide-react";
import { supabaseItemsApi } from "../../../api/supabaseItemsApi";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { can } from "../../../constants/permissions";
import { getItemIdentityKey } from "../../../utils/itemIdentity";
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
import { AdminTabBar } from "./AdminTabBar";
import { ItemsAdminPanel } from "./ItemsAdminPanel";
import { ManagementHomePanel } from "./ManagementHomePanel";
import { ManagementSectionHeader } from "./ManagementSectionHeader";
import { StaffAdminPanel } from "./StaffAdminPanel";
import { useStaffSummaries } from "./adminUtils";

export function AdminScreen({initialTab = "surgery", standalone = false, managementOnly = false, users, currentUser, onLogout, openItemsEditor, openModal, showToast, onInviteStaff, onRunPriceMonitor, onStaffActiveChange, onStaffRoleChange, onOpenShipping}) {
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
  const activeShippingCount = orders.filter(order => ["pending", "hold", "ordered"].includes(order.status)).length;
  const holdOrderCount = orders.filter(order => order.status === "hold").length;
  const { staffSummaryById, todayStaffTotals } = useStaffSummaries({ users, items, txs, orders, surgeries });

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
  const shippingTone = ORDER_ST.ordered;
  const managementSections = [
    {id:"shipping", label:"배송 현황", detail:activeShippingCount ? `진행 ${activeShippingCount}건` : "정상", description:`승인대기, 보류${holdOrderCount ? ` ${holdOrderCount}건` : ""}, 배송중, 입고완료 상태를 확인합니다.`, Icon:Truck, color:shippingTone.text, onClick:onOpenShipping},
    {id:"staff", label:"직원 관리", detail:`활성 ${activeStaffCount}명`, description:"직원 초대, 권한 변경, 활성/비활성 상태를 관리합니다.", Icon:UsersRound, color:T.primary},
    {id:"items", label:"품목 관리", detail:`기준 ${baselineReadyCount}/${items.length}`, description:"품목 추가, 기준값 입력, 재고실사와 초기 데이터를 정리합니다.", Icon:Tags, color:T.success},
    {id:"vendor", label:"도매 설정", detail:`연동 ${vendorLinkedCount}개`, description:"거래처 계정, 자동발주 조건, 가격 감시 정책을 설정합니다.", Icon:Store, color:T.warning},
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
        <AdminTabBar tabs={tabs} adminTab={adminTab} setAdminTab={setAdminTab} />
      )}

      <div style={{flex:1, overflowY:"auto", background:T.grey50, padding:16}}>
        {showManagementHome ? (
          <ManagementHomePanel
            activeStaffCount={activeStaffCount}
            inactiveStaffCount={inactiveStaffCount}
            baselineReadyCount={baselineReadyCount}
            pendingOrderPolicyCount={pendingOrderPolicyCount}
            items={items}
            managementSections={managementSections}
            openManagementSection={openManagementSection}
            setShowInitialInventory={setShowInitialInventory}
            onLogout={onLogout}
          />
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
              <StaffAdminPanel
                users={users}
                currentUser={currentUser}
                canManageStaff={canManageStaff}
                inviteForm={inviteForm}
                setInviteForm={setInviteForm}
                inviteBusy={inviteBusy}
                submitInvite={submitInvite}
                todayStaffTotals={todayStaffTotals}
                staffSummaryById={staffSummaryById}
                onStaffActiveChange={onStaffActiveChange}
                onStaffRoleChange={onStaffRoleChange}
                onLogout={onLogout}
              />
            )}

            {adminTab === "items" && (
              <ItemsAdminPanel
                items={items}
                temporaryItems={temporaryItems}
                baselineReadyCount={baselineReadyCount}
                openModal={openModal}
                setShowStocktake={setShowStocktake}
                setShowInitialInventory={setShowInitialInventory}
              />
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
