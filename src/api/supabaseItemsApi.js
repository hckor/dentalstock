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

  async createItem(clinicId, item) {
    if (!clinicId || !item?.name) throw new Error("item_create_payload_required");

    const { data, error } = await getSupabaseClient()
      .from("items")
      .insert({
        clinic_id: clinicId,
        legacy_id: item.id,
        ...toItemPayload(item),
      })
      .select("id, legacy_id, name, category, unit, stock, min_stock, desired_stock, memo, app_data, updated_at")
      .single();

    if (error) throw error;
    return mapSupabaseItem(data);
  },

  async saveStocktakeAdjustments({ clinicId, actorId, changes }) {
    if (!clinicId || !Array.isArray(changes) || changes.length === 0) return [];

    const supabase = getSupabaseClient();
    const savedItems = [];

    for (const change of changes) {
      const item = change.item;
      if (!item?.supabase_id) throw new Error("item_id_required");

      const beforeQty = toNumber(item.current_qty);
      const afterQty = Math.max(0, toNumber(change.nextQty));
      const delta = afterQty - beforeQty;
      if (delta === 0) continue;

      const savedItem = await this.updateItemDetails({
        ...item,
        current_qty: afterQty,
        last_stocktake_at: change.checkedAt || new Date().toISOString(),
      });
      savedItems.push(savedItem);

      const { error } = await supabase.from("txs").insert({
        clinic_id: clinicId,
        item_id: item.supabase_id,
        type: "adjust",
        quantity: Math.abs(delta),
        reason: change.reason || `재고실사 보정 (${beforeQty} → ${afterQty})`,
        actor_id: actorId || null,
      });
      if (error) throw error;
    }

    return savedItems;
  },

  async saveInitialInventory(clinicId, items) {
    if (!clinicId || !Array.isArray(items) || items.length === 0) return [];
    const rows = items.map(item => ({
      clinic_id: clinicId,
      legacy_id: item.id,
      ...toItemPayload(item),
    }));
    const supabase = getSupabaseClient();
    const legacyIds = rows.map(row => row.legacy_id).filter(Boolean);

    const { data: existingRows, error: existingError } = await supabase
      .from("items")
      .select("id, legacy_id")
      .eq("clinic_id", clinicId)
      .in("legacy_id", legacyIds);

    if (existingError) throw existingError;

    const existingByLegacyId = new Map((existingRows || []).map(row => [row.legacy_id, row.id]));
    const inserts = [];
    const updates = [];

    rows.forEach(row => {
      const existingId = existingByLegacyId.get(row.legacy_id);
      if (existingId) {
        const payload = { ...row };
        delete payload.clinic_id;
        delete payload.legacy_id;
        updates.push({ id: existingId, payload });
      } else {
        inserts.push(row);
      }
    });

    if (inserts.length > 0) {
      const { error } = await supabase.from("items").insert(inserts);
      if (error) throw error;
    }

    for (const update of updates) {
      const { error } = await supabase
        .from("items")
        .update(update.payload)
        .eq("id", update.id);
      if (error) throw error;
    }

    return this.listByClinic(clinicId);
  },
};
