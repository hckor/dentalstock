export const PROFILE_SELECT = "id, clinic_id, email, name, role, is_active, disabled_at, last_seen_at, created_at, updated_at";

export function mapSupabaseRole(role) {
  if (role === "owner" || role === "manager") return role;
  return "hygienist";
}

export function toSupabaseRole(role) {
  if (role === "owner" || role === "manager" || role === "hygienist") return role;
  return "hygienist";
}

export function mapSupabaseProfile(row = {}) {
  return {
    id: row.id,
    supabaseUserId: row.id,
    clinicId: row.clinic_id,
    email: row.email || "",
    name: row.name || row.email || "사용자",
    role: mapSupabaseRole(row.role),
    serverRole: row.role || "hygienist",
    active: row.is_active !== false,
    disabledAt: row.disabled_at || null,
    lastSeenAt: row.last_seen_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}
