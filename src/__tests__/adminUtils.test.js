import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compactCount,
  formatRelativeActivity,
  isTodayValue,
  toValidDate,
} from "../components/screens/AdminScreen/adminUtils";

describe("AdminScreen adminUtils pure utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("날짜 유효성 및 오늘 여부를 안정적으로 판정한다", () => {
    expect(toValidDate(null)).toBeNull();
    expect(toValidDate("not-a-date")).toBeNull();
    expect(toValidDate("2026-05-20T12:00:00+09:00")).toBeInstanceOf(Date);
    expect(isTodayValue("2026-05-20T12:00:00+09:00", "2026-05-20")).toBe(true);
    expect(isTodayValue("2026-05-19T23:59:59+09:00", "2026-05-20")).toBe(false);
  });

  it("상대 활동 시간을 분/시간/일 단위로 표시한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T12:00:00+09:00"));

    expect(formatRelativeActivity(null)).toBe("활동 없음");
    expect(formatRelativeActivity("2026-05-20T11:59:50+09:00")).toBe("방금 전");
    expect(formatRelativeActivity("2026-05-20T11:35:00+09:00")).toBe("25분 전");
    expect(formatRelativeActivity("2026-05-20T09:00:00+09:00")).toBe("3시간 전");
    expect(formatRelativeActivity("2026-05-18T12:00:00+09:00")).toBe("2일 전");
    expect(formatRelativeActivity("2026-05-10T12:00:00+09:00")).toMatch(/05\. 10\./);
  });

  it("카운트 배지는 두 자리 초과에서 99+로 축약한다", () => {
    expect(compactCount(0)).toBe("0");
    expect(compactCount(99)).toBe("99");
    expect(compactCount(100)).toBe("99+");
  });
});
