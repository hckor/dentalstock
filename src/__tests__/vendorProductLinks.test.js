import { describe, expect, it } from "vitest";
import { buildVendorProductLinkGroups, getVendorProductLinkUrls } from "../utils/vendorProductLinks";

describe("vendor product links", () => {
  it("입고대기 발주를 거래처별 상품 링크로 묶고 상품 URL만 열기 후보로 만든다", () => {
    const groups = buildVendorProductLinkGroups(
      [
        { id: "o1", status: "ordered", item_id: "i1", qty: 2, vendor_id: "v1", vendor_name: "A덴탈", vendor_sku: "A-001", vendor_url: "https://a.example/product" },
        { id: "o2", status: "ordered", item_id: "i2", qty: 1, vendor_id: "v1", vendor_name: "A덴탈" },
        { id: "o3", status: "pending", item_id: "i1", qty: 1, vendor_id: "v1", vendor_name: "A덴탈" },
        { id: "o4", status: "ordered", item_id: "i3", qty: 5, vendor_id: "v2", vendor_name: "B덴탈" },
      ],
      [
        { id: "i1", name: "니들", unit: "팩", vendor_options: [] },
        { id: "i2", name: "거즈", unit: "봉", vendor_options: [{ vendor_id: "v1", sku: "G-10", url: "www.a.example/gauze" }] },
        { id: "i3", name: "마스크", unit: "박스", vendor_options: [] },
      ]
    );

    expect(groups).toHaveLength(2);
    const aGroup = groups.find(group => group.vendorName === "A덴탈");
    expect(aGroup).toMatchObject({
      openableCount: 2,
      missingUrlCount: 0,
      urls: ["https://a.example/product", "https://www.a.example/gauze"],
    });
    expect(aGroup.lines[0]).toMatchObject({
      itemName: "니들",
      qty: 2,
      unit: "팩",
      sku: "A-001",
      productUrl: "https://a.example/product",
      actionUrl: "https://a.example/product",
    });

    const bGroup = groups.find(group => group.vendorName === "B덴탈");
    expect(bGroup).toMatchObject({
      openableCount: 0,
      missingUrlCount: 1,
    });
    expect(getVendorProductLinkUrls(bGroup)).toEqual([]);
  });

  it("URL이 없는 거래처는 열기 후보를 만들지 않는다", () => {
    const groups = buildVendorProductLinkGroups(
      [{ id: "o1", status: "ordered", item_id: "missing", qty: 1, vendor_name: "미정" }],
      []
    );

    expect(groups[0]).toMatchObject({ openableCount: 0, missingUrlCount: 1 });
    expect(getVendorProductLinkUrls(groups[0])).toEqual([]);
  });
});
