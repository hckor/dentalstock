import { describe, expect, it } from "vitest";
import {
  findSimilarInventoryItem,
  getItemBaseIdentityKey,
  getItemIdentityKey,
} from "../utils/itemIdentity";

describe("item identity duplicate guard", () => {
  it("괄호와 공백 차이가 있는 장갑 규격명을 같은 키로 비교한다", () => {
    expect(getItemIdentityKey("라텍스 장갑 (M)")).toBe("라텍스장갑m");
    expect(getItemIdentityKey("라텍스장갑M")).toBe("라텍스장갑m");
    expect(getItemIdentityKey("라텍스 장갑 M")).toBe("라텍스장갑m");
  });

  it("사이즈가 있는 품목은 대표 베이스 키도 계산한다", () => {
    expect(getItemBaseIdentityKey("라텍스 장갑 (M)")).toBe("라텍스장갑");
    expect(getItemBaseIdentityKey("라텍스 장갑 Mini")).toBe("라텍스장갑mini");
    expect(getItemBaseIdentityKey("Dental")).toBe("dental");
  });

  it("정확히 같은 정규화 품목과 사이즈가 빠진 유사 품목을 구분한다", () => {
    const items = [{ id: "1", name: "라텍스 장갑 (M)" }];

    expect(findSimilarInventoryItem(items, "라텍스장갑M")).toMatchObject({
      item: items[0],
      kind: "exact",
    });
    expect(findSimilarInventoryItem(items, "라텍스장갑")).toMatchObject({
      item: items[0],
      kind: "similar",
    });
    expect(findSimilarInventoryItem(items, "라텍스 장갑 Mini")).toBeNull();
  });
});
