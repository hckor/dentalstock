import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function compareAppItems(a, b) {
  const categoryDiff = toNumber(a.category_id, 0) - toNumber(b.category_id, 0);
  if (categoryDiff !== 0) return categoryDiff;

  const aId = toNumber(a.id, Number.POSITIVE_INFINITY);
  const bId = toNumber(b.id, Number.POSITIVE_INFINITY);
  if (aId !== bId) return aId - bId;

  return String(a.name || "").localeCompare(String(b.name || ""), "ko");
}

export function mapSupabaseItem(row = {}) {
  const appData = row.app_data && typeof row.app_data === "object" ? row.app_data : {};
  const categoryId = toNumber(appData.category_id ?? row.category, 1);

  return {
    ...appData,
    id: appData.id || row.legacy_id || row.id,
    supabase_id: row.id,
    name: row.name,
    category_id: categoryId,
    unit: row.unit || "개",
    current_qty: toNumber(row.stock),
    min_qty: toNumber(row.min_stock),
    location: appData.location || row.memo || "",
    expiry: appData.expiry ?? null,
    vendor_options: Array.isArray(appData.vendor_options) ? appData.vendor_options : [],
  };
}

function toItemPayload(item) {
  const appData = {
    ...(item || {}),
    id: item.id,
    category_id: item.category_id,
    location: item.location || "",
    expiry: item.expiry ?? null,
    vendor_options: Array.isArray(item.vendor_options) ? item.vendor_options : [],
  };

  return {
    name: item.name,
    category: item.category_id,
    unit: item.unit || "개",
    stock: Number(item.current_qty) || 0,
    min_stock: Number(item.min_qty) || 0,
    memo: item.location || "",
    app_data: appData,
  };
}

export const supabaseItemsApi = {
  isEnabled() {
    const config = getApiConfig();
    return config.isSupabaseMode && isSupabaseConfigured();
  },

  async listByClinic(clinicId) {
    if (!clinicId) return [];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("id, legacy_id, name, category, unit, stock, min_stock, desired_stock, memo, app_data, updated_at")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("legacy_id", { ascending: true, nullsFirst: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseItem).sort(compareAppItems);
  },

  async applyStockTransaction({ itemId, type, quantity, reason = "" }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("apply_stock_transaction", {
      p_item_id: itemId,
      p_type: type,
      p_quantity: quantity,
      p_reason: reason,
    });

    if (error) throw error;
    return mapSupabaseItem(data);
  },

  async updateItemDetails(item) {
    const itemId = item?.supabase_id;
    if (!itemId) throw new Error("item_id_required");

    const { data, error } = await getSupabaseClient()
      .from("items")
      .update(toItemPayload(item))
      .eq("id", itemId)
      .select("id, legacy_id, name, category, unit, stock, min_stock, desired_stock, memo, app_data, updated_at")
      .single();

    if (error) throw error;
    return mapSupabaseItem(data);
  },

  async saveInitialInventory(clinicId, items) {
    if (!clinicId || !Array.isArray(items) || items.length === 0) return [];
    const rows = items.map(item => ({
      clinic_id: clinicId,
      legacy_id: item.id,
      ...toItemPayload(item),
    }));

    const { data, error } = await getSupabaseClient()
      .from("items")
      .upsert(rows, { onConflict: "clinic_id,legacy_id" })
      .select("id, legacy_id, name, category, unit, stock, min_stock, desired_stock, memo, app_data, updated_at");

    if (error) throw error;
    return (data || []).map(mapSupabaseItem).sort(compareAppItems);
  },
};
