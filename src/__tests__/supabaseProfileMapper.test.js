import { describe, expect, it } from "vitest";
import { mapSupabaseProfile, mapSupabaseRole, toSupabaseRole } from "../api/supabaseProfileMapper";

describe("supabase profile mapper", () => {
  it("maps all supported staff roles without collapsing staff to hygienist", () => {
    expect(mapSupabaseRole("owner")).toBe("owner");
    expect(mapSupabaseRole("manager")).toBe("manager");
    expect(mapSupabaseRole("hygienist")).toBe("hygienist");
    expect(mapSupabaseRole("staff")).toBe("staff");
    expect(mapSupabaseRole("unexpected")).toBe("hygienist");
  });

  it("keeps staff role when sending values back to Supabase", () => {
    expect(toSupabaseRole("staff")).toBe("staff");
    expect(toSupabaseRole("unknown")).toBe("hygienist");
  });

  it("normalizes profile fields used by the staff management screen", () => {
    expect(mapSupabaseProfile({
      id: "profile-1",
      clinic_id: "clinic-1",
      email: "staff@example.com",
      name: "",
      role: "staff",
      is_active: false,
      disabled_at: "2026-05-21T00:00:00.000Z",
    })).toMatchObject({
      id: "profile-1",
      supabaseUserId: "profile-1",
      clinicId: "clinic-1",
      email: "staff@example.com",
      name: "staff@example.com",
      role: "staff",
      serverRole: "staff",
      active: false,
      disabledAt: "2026-05-21T00:00:00.000Z",
    });
  });
});
