import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";
import { mapSupabaseItem } from "./supabaseItemsApi";

const ORDER_SELECT = "id, legacy_id, vendor, status, requested_by, approved_by, shipment_group_id, tracking_number, requested_at, approved_at, received_at, items, totals, notes, app_data, updated_at, requester:profiles!orders_requested_by_fkey(id, name, role), approver:profiles!orders_approved_by_fkey(id, name, role)";
const REVIEWED_STATUSES = new Set(["ordered", "received", "rejected", "approved", "shipping"]);
const APP_DATA_BLOCKLIST = new Set([
  "supabase_id",
  "status",
  "requested_by_id",
  "approved_by_id",
  "shipment_group_id",
  "tracking_number",
  "reviewed_at",
  "received_at",
]);

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstOrderItem(row = {}) {
  return Array.isArray(row.items) && row.items.length ? row.items[0] : {};
}

function mapOrderStatus(status) {
  if (status === "approved" || status === "shipping") return "ordered";
  return status || "pending";
}

function safeOrderAppData(order = {}) {
  return Object.fromEntries(
    Object.entries(order).filter(([key]) => !APP_DATA_BLOCKLIST.has(key))
  );
}

export function mapSupabaseOrder(row = {}) {
  const appData = row.app_data && typeof row.app_data === "object" ? row.app_data : {};
  const item = firstOrderItem(row);
  const status = mapOrderStatus(row.status);
  const isReviewed = REVIEWED_STATUSES.has(status) || Boolean(row.approved_at);
  const hasTracking = Boolean(row.tracking_number);
  return {
    ...appData,
    id: appData.id || row.legacy_id || row.id,
    supabase_id: row.id,
    item_id: item.item_id || appData.item_id || "",
    requested_by: row.requester?.name || (row.requested_by ? "사용자" : appData.requested_by || "관리자"),
    requested_by_id: row.requested_by || null,
    requested_at: row.requested_at || appData.requested_at,
    qty: toNumber(appData.qty ?? item.qty, 1),
    note: appData.note ?? row.notes ?? "",
    status,
    reviewed_by: row.approver?.name || (isReviewed && row.approved_at ? appData.reviewed_by : null),
    approved_by_id: row.approved_by || null,
    reviewed_at: row.approved_at || null,
    review_note: appData.review_note || "",
    vendor_id: appData.vendor_id || "",
    vendor_name: appData.vendor_name || row.vendor || "거래처 미정",
    vendor_price: appData.vendor_price ?? row.totals?.vendor_price ?? null,
    vendor_selection: appData.vendor_selection || "unassigned",
    shipment_group_id: row.shipment_group_id || undefined,
    carrier: hasTracking ? appData.carrier || undefined : undefined,
    tracking_number: row.tracking_number || undefined,
    received_qty: appData.received_qty,
    received_at: row.received_at || undefined,
    partial_received_at: appData.partial_received_at,
    shipping_events: isReviewed && Array.isArray(appData.shipping_events) ? appData.shipping_events : [],
  };
}

function toOrderPayload(order, actor = null) {
  const vendorName = order.vendor_name || "거래처 미정";
  return {
    vendor: vendorName,
    status: "pending",
    requested_by: actor?.supabaseUserId || actor?.id || null,
    approved_by: null,
    shipment_group_id: order.shipment_group_id || null,
    tracking_number: order.tracking_number || null,
    requested_at: order.requested_at,
    approved_at: null,
    received_at: null,
    items: [{ item_id: order.item_id, qty: order.qty }],
    totals: {
      vendor_price: order.vendor_price ?? null,
    },
    notes: order.note || "",
    app_data: safeOrderAppData(order),
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

  async createOrder(clinicId, order, actor = null) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        clinic_id: clinicId,
        legacy_id: order.id,
        ...toOrderPayload(order, actor),
      })
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseOrder(data);
  },

  async updateOrder(order, patch, actor = null) {
    const supabaseId = order.supabase_id;
    if (!supabaseId) throw new Error("supabase_order_id_missing");

    const nextOrder = { ...order, ...patch };
    const reviewedBy = REVIEWED_STATUSES.has(nextOrder.status)
      ? actor?.supabaseUserId || nextOrder.approved_by_id || null
      : null;
    const { data, error } = await getSupabaseClient()
      .from("orders")
      .update({
        status: nextOrder.status,
        approved_by: reviewedBy,
        shipment_group_id: nextOrder.shipment_group_id || null,
        tracking_number: nextOrder.tracking_number || null,
        approved_at: nextOrder.reviewed_at || null,
        received_at: nextOrder.received_at || null,
        notes: nextOrder.note || "",
        app_data: safeOrderAppData(nextOrder),
      })
      .eq("id", supabaseId)
      .select(ORDER_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseOrder(data);
  },

  async updateOrders(orders, actor = null) {
    return Promise.all(orders.map(order => this.updateOrder(order, order, actor)));
  },

  async receiveOrder(order, { actualQty, note = "" }) {
    if (!order.supabase_id) throw new Error("supabase_order_id_missing");

    const { data, error } = await getSupabaseClient().rpc("receive_order_stock", {
      p_order_id: order.supabase_id,
      p_actual_qty: actualQty,
      p_note: note,
      p_shipping_events: Array.isArray(order.shipping_events) ? order.shipping_events : null,
    });

    if (error) throw error;
    return {
      order: mapSupabaseOrder(data?.order || {}),
      item: mapSupabaseItem(data?.item || {}),
    };
  },
};
