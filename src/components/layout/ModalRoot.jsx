import { BottomSheet } from "../shared/BottomSheet";
import { ItemPickerSheet } from "../modals/ItemPickerSheet";
import { InOutSheet } from "../modals/InOutSheet";
import { OrderRequestSheet } from "../modals/OrderRequestSheet";
import { ReceiptConfirmSheet } from "../modals/ReceiptConfirmSheet";
import { AddItemModal } from "../modals/AddItemModal";
import { EditItemModal } from "../modals/EditItemModal";
import { EditSurgeryItemsSheet } from "../modals/EditSurgeryItemsSheet";
import { ShippingDetailModal } from "../modals/ShippingDetailModal";

export function ModalRoot({
  modal, setModal, selItem, setSelItem, form, setForm,
  items, setItems, orders, currentUser,
  commit, submitOrder, confirmReceipt, showToast,
  editItemsState, setEditItemsState, openModal,
}) {
  return (
    <>
      {modal && (
        <BottomSheet onClose={()=>setModal(null)}>
          {(modal==="in"||modal==="out") && !selItem && (
            <ItemPickerSheet items={items} setSelItem={setSelItem} onClose={()=>setModal(null)}/>
          )}
          {(modal==="in"||modal==="out") && selItem && (
            <InOutSheet modal={modal} selItem={selItem} form={form} setForm={setForm} onCommit={()=>commit(modal, selItem, form)} onClose={()=>setModal(null)}/>
          )}
          {modal==="order_req" && selItem && (
            <OrderRequestSheet item={selItem} currentUser={currentUser} onSubmit={submitOrder} onClose={()=>setModal(null)} orders={orders}/>
          )}
          {modal==="confirm_receipt" && selItem && (
            <ReceiptConfirmSheet item={selItem} orders={orders} currentUser={currentUser} onConfirm={confirmReceipt} onClose={()=>setModal(null)}/>
          )}
          {modal==="add_item" && (
            <AddItemModal setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>
          )}
          {modal==="edit_item" && selItem && (
            <EditItemModal item={selItem} setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>
          )}
          {modal==="shipping_detail" && selItem && (
            <ShippingDetailModal
              order={selItem}
              item={items.find(i => i.id === selItem.item_id)}
              onClose={()=>setModal(null)}
              openModal={openModal}
            />
          )}
        </BottomSheet>
      )}

      {editItemsState && (
        <BottomSheet onClose={()=>setEditItemsState(null)}>
          <EditSurgeryItemsSheet
            initialItems={editItemsState.initialItems}
            allItems={items}
            title={editItemsState.title}
            onSave={editItemsState.onSave}
            onClose={()=>setEditItemsState(null)}
          />
        </BottomSheet>
      )}
    </>
  );
}
