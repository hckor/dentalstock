import { getApiConfig } from "../config/apiMode";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseAuthApi";
import { mapSupabaseItem } from "./supabaseItemsApi";

const SURGERY_SELECT = "id, legacy_id, patient_name, procedure_name, scheduled_at, status, expected_items, actual_items, notes, prepared_at, usage_confirmed_at, app_data, updated_at";

function toDateParts(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { scheduled_date: "", scheduled_time: "" };
  }
  const dateTime = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const [scheduledDate, scheduledTime] = dateTime.split(" ");
  return {
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
  };
}

function toScheduledAt(surgery) {
  if (!surgery?.scheduled_date || !surgery?.scheduled_time) return new Date().toISOString();
  return `${surgery.scheduled_date}T${surgery.scheduled_time}:00+09:00`;
}

export function mapSupabaseSurgery(row = {}) {
  const appData = row.app_data && typeof row.app_data === "object" ? row.app_data : {};
  const scheduled = toDateParts(row.scheduled_at);
  const usageConfirmed = appData.usage_confirmed ?? row.status === "completed";
  const prepConfirmed = appData.prep_confirmed ?? ["prepared", "completed"].includes(row.status);

  return {
    ...appData,
    id: appData.id || row.legacy_id || row.id,
    supabase_id: row.id,
    title: appData.title || row.procedure_name || "수술",
    patient: appData.patient || row.patient_name || "-",
    type: appData.type || "implant",
    scheduled_date: appData.scheduled_date || scheduled.scheduled_date,
    scheduled_time: appData.scheduled_time || scheduled.scheduled_time,
    note: appData.note ?? row.notes ?? "",
    required_items: Array.isArray(appData.required_items) ? appData.required_items : row.expected_items || [],
    created_by: appData.created_by || "관리자",
    prep_confirmed: Boolean(prepConfirmed),
    prepared_by: appData.prepared_by || null,
    prepared_at: appData.prepared_at || row.prepared_at || null,
    usage_confirmed: Boolean(usageConfirmed),
    usage_confirmed_by: appData.usage_confirmed_by || null,
    usage_confirmed_at: appData.usage_confirmed_at || row.usage_confirmed_at || null,
    actual_items: appData.actual_items || row.actual_items || null,
    usage_note: appData.usage_note || "",
  };
}

function toStatus(surgery) {
  if (surgery.usage_confirmed) return "completed";
  if (surgery.prep_confirmed) return "prepared";
  return "planned";
}

function toSurgeryPayload(clinicId, surgery, currentUser) {
  return {
    clinic_id: clinicId,
    legacy_id: surgery.id,
    patient_name: surgery.patient || "-",
    procedure_name: surgery.title || "수술",
    scheduled_at: toScheduledAt(surgery),
    status: toStatus(surgery),
    expected_items: Array.isArray(surgery.required_items) ? surgery.required_items : [],
    actual_items: Array.isArray(surgery.actual_items) ? surgery.actual_items : [],
    prepared_by: surgery.prep_confirmed ? currentUser?.supabaseUserId || currentUser?.id || null : null,
    confirmed_by: surgery.usage_confirmed ? currentUser?.supabaseUserId || currentUser?.id || null : null,
    notes: surgery.note || "",
    prepared_at: surgery.prepared_at || null,
    usage_confirmed_at: surgery.usage_confirmed_at || null,
    app_data: surgery,
  };
}

export const supabaseSurgeriesApi = {
  isEnabled() {
    const config = getApiConfig();
    return config.isSupabaseMode && isSupabaseConfigured();
  },

  async listByClinic(clinicId) {
    if (!clinicId) return [];
    const { data, error } = await getSupabaseClient()
      .from("surgeries")
      .select(SURGERY_SELECT)
      .eq("clinic_id", clinicId)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSupabaseSurgery);
  },

  async createSurgery(clinicId, surgery, currentUser) {
    const { data, error } = await getSupabaseClient()
      .from("surgeries")
      .insert(toSurgeryPayload(clinicId, surgery, currentUser))
      .select(SURGERY_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseSurgery(data);
  },

  async updateSurgery(surgery, patch, currentUser) {
    if (!surgery.supabase_id) throw new Error("supabase_surgery_id_missing");
    const nextSurgery = { ...surgery, ...patch };
    const payload = toSurgeryPayload(undefined, nextSurgery, currentUser);
    delete payload.clinic_id;
    delete payload.legacy_id;

    const { data, error } = await getSupabaseClient()
      .from("surgeries")
      .update(payload)
      .eq("id", surgery.supabase_id)
      .select(SURGERY_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseSurgery(data);
  },

  async cancelSurgery(surgery, currentUser) {
    if (!surgery.supabase_id) throw new Error("supabase_surgery_id_missing");
    const nextSurgery = {
      ...surgery,
      cancelled_at: new Date().toISOString(),
      cancelled_by: currentUser?.name || "",
    };

    const { data, error } = await getSupabaseClient()
      .from("surgeries")
      .update({
        status: "cancelled",
        app_data: nextSurgery,
      })
      .eq("id", surgery.supabase_id)
      .select(SURGERY_SELECT)
      .single();

    if (error) throw error;
    return mapSupabaseSurgery(data);
  },

  async confirmUsage(surgery, { usageItems, note = "" }) {
    if (!surgery.supabase_id) throw new Error("supabase_surgery_id_missing");

    const { data, error } = await getSupabaseClient().rpc("confirm_surgery_usage", {
      p_surgery_id: surgery.supabase_id,
      p_actual_items: usageItems,
      p_note: note,
    });

    if (error) throw error;
    return {
      surgery: mapSupabaseSurgery(data?.surgery || {}),
      items: Array.isArray(data?.items) ? data.items.map(mapSupabaseItem) : [],
    };
  },
};
