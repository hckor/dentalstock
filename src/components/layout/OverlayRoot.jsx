import { lazy, Suspense } from "react";
import { T } from "../../constants/colors";

const ItemDetailScreen       = lazy(() => import("../screens/ItemDetailScreen").then(m => ({ default: m.ItemDetailScreen })));
const ExpiryManagementScreen = lazy(() => import("../screens/ExpiryManagementScreen").then(m => ({ default: m.ExpiryManagementScreen })));
const ProfileSheet           = lazy(() => import("../screens/ProfileSheet").then(m => ({ default: m.ProfileSheet })));

const overlayStyle = {position:"absolute", inset:0, zIndex:100, background:T.white};

export function OverlayRoot({
  detailItem, showExpiry, showProfile,
  items, txs, orders, currentUser,
  onCloseDetail, onCloseExpiry, onCloseProfile,
  openModal, onLogout,
}) {
  return (
    <>
      {detailItem && (
        <div style={overlayStyle}>
          <Suspense fallback={null}>
            <ItemDetailScreen
              item={detailItem}
              txs={txs}
              orders={orders}
              onClose={onCloseDetail}
              onIn={()=>openModal("in", detailItem)}
              onOut={()=>openModal("out", detailItem)}
              onOrder={()=>openModal("order_req", detailItem)}
            />
          </Suspense>
        </div>
      )}

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
