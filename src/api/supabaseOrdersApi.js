import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";

const ORDER_SELECT = "id, legacy_id, vendor, status, shipment_group_id, tracking_number, requested_at, approved_at, received_at, items, totals, notes, app_data, updated_at";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstOrderItem(row = {}) {
  return Array.isArray(row.items) && row.items.length ? row.items[0] : {};
}

export function mapSupabaseOrder(row = {}) {
  const appData = row.app_data && typeof row.app_data === "object" ? row.app_data : {};
  const item = firstOrderItem(row);
  return {
    ...appData,
    id: appData.id || row.legacy_id || row.id,
    supabase_id: row.id,
    item_id: appData.item_id || item.item_id || "",
    requested_by: appData.requested_by || "관리자",
    requested_at: appData.requested_at || row.requested_at,
    qty: toNumber(appData.qty ?? item.qty, 1),
    note: appData.note ?? row.notes ?? "",
    status: appData.status || row.status || "pending",
    reviewed_by: appData.reviewed_by ?? null,
    reviewed_at: appData.reviewed_at || row.approved_at || null,
    review_note: appData.review_note || "",
    vendor_id: appData.vendor_id || "",
    vendor_name: appData.vendor_name || row.vendor || "거래처 미정",
    vendor_price: appData.vendor_price ?? row.totals?.vendor_price ?? null,
    vendor_selection: appData.vendor_selection || "unassigned",
    shipment_group_id: appData.shipment_group_id || row.shipment_group_id || undefined,
    carrier: appData.carrier || undefined,
    tracking_number: appData.tracking_number || row.tracking_number || undefined,
    received_qty: appData.received_qty,
    received_at: appData.received_at || row.received_at || undefined,
    partial_received_at: appData.partial_received_at,
    shipping_events: Array.isArray(appData.shipping_events) ? appData.shipping_events : [],
  };
}

function toOrderPayload(order) {
  const vendorName = order.vendor_name || "거래처 미정";
  return {
    vendor: vendorName,
    status: order.status || "pending",
    shipment_group_id: order.shipment_group_id || null,
    tracking_number: order.tracking_number || null,
    requested_at: order.requested_at,
    items: [{ item_id: order.item_id, qty: order.qty }],
    totals: {
      vendor_price: order.vendor_price ?? null,
    },
    notes: order.note || "",
    app_data: order,
  };
}

export const supabaseOrdersApi = {
  isEnabled() {
    const config = getApiConfig();
    return config.isSupabaseMode && isSupabaseConfigured();
  },

  async listByClinic(clinicId) {
    if (!clinicId) return [];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("clinic_id", clinicId)
      .order("requested_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseOrder);
  },

  async createOrder(clinicId, order) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        clinic_id: clinicId,
        legacy_id: order.id,
        ...toOrderPayload(order),
      })
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseOrder(data);
  },

  async updateOrder(order, patch) {
    const supabaseId = order.supabase_id;
    if (!supabaseId) throw new Error("supabase_order_id_missing");

    const nextOrder = { ...order, ...patch };
    const { data, error } = await getSupabaseClient()
      .from("orders")
      .update({
        status: nextOrder.status,
        shipment_group_id: nextOrder.shipment_group_id || null,
        tracking_number: nextOrder.tracking_number || null,
        approved_at: nextOrder.reviewed_at || null,
        received_at: nextOrder.received_at || null,
        notes: nextOrder.note || "",
        app_data: nextOrder,
      })
      .eq("id", supabaseId)
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseOrder(data);
  },
};
