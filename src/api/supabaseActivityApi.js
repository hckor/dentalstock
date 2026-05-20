import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";

const TX_SELECT = "id, type, quantity, reason, created_at, items(id, legacy_id, name, unit, app_data), actor:profiles(id, name)";
const NOTIF_SELECT = "id, legacy_id, type, title, body, payload, read_at, created_at, app_data";
const AUDIT_SELECT = "id, actor_id, action, target_type, target_id, metadata, created_at, actor:profiles(id, name, role)";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function mapSupabaseTx(row = {}) {
  const item = row.items || {};
  const itemAppData = item.app_data && typeof item.app_data === "object" ? item.app_data : {};
  return {
    id: row.id,
    item_id: itemAppData.id || item.legacy_id || item.id || "",
    item_name: item.name || "",
    type: row.type,
    qty: toNumber(row.quantity),
    note: row.reason || "",
    created_at: row.created_at,
    user: row.actor?.name || "system",
  };
}

export function mapSupabaseNotif(row = {}) {
  const appData = row.app_data && typeof row.app_data === "object" ? row.app_data : {};
  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    ...payload,
    ...appData,
    id: appData.id || row.legacy_id || row.id,
    supabase_id: row.id,
    type: appData.type || row.type,
    message: appData.message || row.title,
    sub: appData.sub ?? row.body ?? "",
    is_read: Boolean(row.read_at || appData.is_read),
    created_at: appData.created_at || row.created_at,
  };
}

function toNotifPayload(clinicId, notif) {
  return {
    clinic_id: clinicId,
    legacy_id: notif.id,
    type: notif.type || "info",
    title: notif.message || "알림",
    body: notif.sub || null,
    payload: {
      item_id: notif.item_id ?? null,
      surgery_id: notif.surgery_id ?? null,
      order_id: notif.order_id ?? null,
    },
    read_at: notif.is_read ? new Date().toISOString() : null,
    created_at: notif.created_at || new Date().toISOString(),
    app_data: notif,
  };
}

export function mapSupabaseAuditLog(row = {}) {
  return {
    id: row.id,
    action: row.action,
    entity_type: row.target_type,
    entity_id: row.target_id,
    actor: {
      userId: row.actor_id || row.actor?.id || null,
      name: row.actor?.name || "system",
      role: row.actor?.role || "unknown",
    },
    metadata: row.metadata || {},
    created_at: row.created_at,
  };
}

function isEnabled() {
  const config = getApiConfig();
  return config.isSupabaseMode && isSupabaseConfigured();
}

export const supabaseActivityApi = {
  isEnabled,

  async listTxsByClinic(clinicId) {
    if (!clinicId) return [];
    const { data, error } = await getSupabaseClient()
      .from("txs")
      .select(TX_SELECT)
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;
    return (data || []).map(mapSupabaseTx);
  },

  async listNotifsByClinic(clinicId) {
    if (!clinicId) return [];
    const { data, error } = await getSupabaseClient()
      .from("notifs")
      .select(NOTIF_SELECT)
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data || []).map(mapSupabaseNotif);
  },

  async saveNotifsForClinic(clinicId, notifs) {
    if (!clinicId || !Array.isArray(notifs) || notifs.length === 0) return [];
    const payload = notifs
      .filter(notif => notif?.id)
      .map(notif => toNotifPayload(clinicId, notif));
    if (!payload.length) return [];

    const { data, error } = await getSupabaseClient()
      .from("notifs")
      .upsert(payload, { onConflict: "clinic_id,legacy_id" })
      .select(NOTIF_SELECT);

    if (error) throw error;
    return (data || []).map(mapSupabaseNotif);
  },

  async listAuditLogsByClinic(clinicId) {
    if (!clinicId) return [];
    const { data, error } = await getSupabaseClient()
      .from("audit_logs")
      .select(AUDIT_SELECT)
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;
    return (data || []).map(mapSupabaseAuditLog);
  },

  async recordAuditLog(log, actor) {
    if (!isEnabled() || !actor?.clinicId || !log?.action) return null;
    const { data, error } = await getSupabaseClient()
      .from("audit_logs")
      .insert({
        clinic_id: actor.clinicId,
        actor_id: actor.supabaseUserId || actor.id || null,
        action: log.action,
        target_type: log.entity_type || "unknown",
        target_id: log.entity_id ? String(log.entity_id) : null,
        metadata: log.metadata || {},
        created_at: log.created_at || new Date().toISOString(),
      })
      .select(AUDIT_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseAuditLog(data);
  },
};
