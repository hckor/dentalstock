import { describe, expect, it } from "vitest";
import {
  getDeleteStaffErrorMessage,
  mapSupabaseRpcErrorMessage,
} from "../utils/supabaseRpcErrors";

describe("supabase RPC error mapping", () => {
  it("maps delete staff SQLSTATE and PostgREST codes to Korean messages", () => {
    expect(getDeleteStaffErrorMessage({ code: "23514" })).toBe("마지막 원장은 목록에서 제거할 수 없습니다");
    expect(getDeleteStaffErrorMessage({ code: "42501" })).toBe("권한이 없거나 본인 계정은 삭제할 수 없습니다");
    expect(getDeleteStaffErrorMessage({ code: "P0002" })).toBe("삭제할 직원을 찾을 수 없습니다");
  });

  it("falls back when an RPC code is unknown", () => {
    expect(getDeleteStaffErrorMessage({ code: "PGRST000", message: "Unexpected" })).toBe("직원을 목록에서 제거하지 못했습니다");
  });

  it("keeps the generic mapper reusable for future RPC errors", () => {
    expect(
      mapSupabaseRpcErrorMessage(
        { cause: { code: "42501" } },
        { 42501: "권한이 없습니다" },
        "처리하지 못했습니다",
      ),
    ).toBe("권한이 없습니다");
  });
});
