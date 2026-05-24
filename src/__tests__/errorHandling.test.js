import { describe, expect, it, vi } from "vitest";
import { getErrorDetail, handleAppError } from "../utils/errorHandling";

describe("error handling utilities", () => {
  it("에러 원인을 문자열로 정규화한다", () => {
    expect(getErrorDetail(new Error("network_down"))).toBe("network_down");
    expect(getErrorDetail("plain")).toBe("plain");
    expect(getErrorDetail({ code: "PGRST301" })).toBe('{"code":"PGRST301"}');
  });

  it("사용자 메시지가 있으면 토스트로 전달한다", () => {
    const showToast = vi.fn();
    const handled = handleAppError(new Error("failed"), {
      context: "orders.save",
      userMessage: "저장에 실패했습니다",
      showToast,
    });

    expect(showToast).toHaveBeenCalledWith("저장에 실패했습니다");
    expect(handled).toMatchObject({ context: "orders.save", detail: "failed" });
  });
});
