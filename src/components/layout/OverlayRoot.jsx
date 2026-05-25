import { lazy, Suspense } from "react";
import { T } from "../../constants/colors";
import { useInventory } from "../../contexts/InventoryContext";
import { useOrders } from "../../contexts/OrderContext";

const ItemDetailScreen       = lazy(() => import("../screens/ItemDetailScreen").then(m => ({ default: m.ItemDetailScreen })));
const ExpiryManagementScreen = lazy(() => import("../screens/ExpiryManagementScreen").then(m => ({ default: m.ExpiryManagementScreen })));
const ProfileSheet           = lazy(() => import("../screens/ProfileSheet").then(m => ({ default: m.ProfileSheet })));

const overlayStyle = {position:"absolute", inset:0, zIndex:100, background:T.white};

export function OverlayRoot({
  detailItem, showExpiry, showProfile,
  currentUser, canEdit,
  onCloseDetail, onCloseExpiry, onCloseProfile,
  openModal, onLogout,
}) {
  const { items, txs } = useInventory();
  const { orders } = useOrders();
  return (
    <>
      {detailItem && (() => {
        const liveItem = items.find(i => i.id === detailItem.id) || detailItem;
        return (
          <div style={overlayStyle}>
            <Suspense fallback={null}>
              <ItemDetailScreen
                item={liveItem}
                txs={txs}
                orders={orders}
                currentUser={currentUser}
                onClose={onCloseDetail}
                onIn={()=>openModal("in", liveItem)}
                onOut={()=>openModal("out", liveItem)}
                onOrder={()=>openModal("order_req", liveItem)}
                onEdit={canEdit ? () => openModal("edit_item", liveItem) : null}
              />
            </Suspense>
          </div>
        );
      })()}

      {showExpiry && (
        <div style={overlayStyle}>
          <Suspense fallback={null}>
            <ExpiryManagementScreen items={items} onClose={onCloseExpiry} openModal={openModal}/>
          </Suspense>
        </div>
      )}

      {showProfile && (
        <Suspense fallback={null}>
          <ProfileSheet currentUser={currentUser} onClose={onCloseProfile} onLogout={onLogout}/>
        </Suspense>
      )}
    </>
  );
}
