import { settingsApi } from "../api/settingsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { resolveOrderVendorForQty } from "../utils/vendorSelection";

export const shouldUseSupabaseOrders = (currentUser) =>
  supabaseOrdersApi.isEnabled() && Boolean(currentUser?.supabaseUserId);

export const buildVendorSnapshot = (item, qty = 1) =>
  resolveOrderVendorForQty(item, settingsApi.load(), qty);

export function mergeUpdatedOrder(prevOrders, updatedOrder) {
  return prevOrders.map(order => order.id === updatedOrder.id ? updatedOrder : order);
}

export function mergeUpdatedItem(prevItems, updatedItem) {
  return prevItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item);
}
