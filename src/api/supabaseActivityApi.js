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
    const persisted = notifs.filter(notif => notif?.supabase_id);
    if (!persisted.length) return [];

    const results = await Promise.all(persisted.map(async (notif) => {
      const { data, error } = await getSupabaseClient().rpc("set_notification_read_state", {
        p_notification_id: notif.supabase_id,
        p_is_read: Boolean(notif.is_read),
      });
      if (error) throw error;
      return data;
    }));

    return results.filter(Boolean).map(mapSupabaseNotif);
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
    const { data, error } = await getSupabaseClient().rpc("record_audit_log", {
      p_action: log.action,
      p_target_type: log.entity_type || "unknown",
      p_target_id: log.entity_id ? String(log.entity_id) : null,
      p_metadata: log.metadata || {},
    });

    if (error) throw error;
    return mapSupabaseAuditLog(data);
  },
};
