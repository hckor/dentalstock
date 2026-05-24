import { useMemo } from "react";
import { can } from "../../constants/permissions";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";
import { useSurgery } from "../../contexts/SurgeryContext";
import { buildHomeDashboard } from "../../utils/homeDashboard";
import { OwnerHome } from "./home/OwnerHome";
import { ManagerHome } from "./home/ManagerHome";
import { StaffHome } from "./home/StaffHome";

export function HomeScreen({
  currentUser,
  users = [],
  setTab,
  openModal,
  canApprove,
  openItemsEditor,
}) {
  const { items, txs } = useInventory();
  const { orders } = useOrders();
  const { surgeries, confirmSurgeryPrep, confirmSurgeryUsage, updateSurgeryItems } = useSurgery();
  const role = currentUser?.role || "staff";
  const dashboard = useMemo(() => buildHomeDashboard({ items, txs, orders, surgeries }), [items, orders, surgeries, txs]);
  const canManageSurgery = can(role, "surgery_manage");
  const canConfirmSurgery = can(role, "surgery_confirm");
  const canViewSurgery = can(role, "surgery_view_all") || can(role, "surgery_view_today") || canConfirmSurgery;

  const commonProps = {
    role,
    currentUser,
    users,
    dashboard,
    items,
    txs,
    orders,
    surgeries,
    setTab,
    openModal,
    canApprove,
    canManageSurgery,
    canConfirmSurgery,
    canViewSurgery,
    confirmSurgeryPrep,
    confirmSurgeryUsage,
    openItemsEditor,
    updateSurgeryItems,
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {can(role, "home_cost") ? (
        <OwnerHome {...commonProps} />
      ) : can(role, "home_operations") ? (
        <ManagerHome {...commonProps} />
      ) : (
        <StaffHome {...commonProps} />
      )}
    </div>
  );
}
