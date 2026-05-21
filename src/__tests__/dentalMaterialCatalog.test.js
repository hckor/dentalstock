import { describe, expect, it } from "vitest";
import { cleanMaterialName, materialToInventoryItem, searchMaterials } from "../utils/dentalMaterialCatalog";

describe("dental material catalog", () => {
  it("카탈로그 표시/저장용 이름에서 쇼핑몰 판촉 문구를 제거한다", () => {
    expect(cleanMaterialName("[50%체험특가] [밀링머신전용] CAD/CAM Milling Bur")).toBe("CAD/CAM Milling Bur");
    expect(cleanMaterialName("#신제품 멸균 파우치")).toBe("멸균 파우치");
  });

  it("초기 재고 품목으로 변환할 때 정리된 이름을 저장한다", () => {
    const item = materialToInventoryItem({
      source: "edent",
      source_product_id: "100",
      name: "[밀링머신전용] Milling Bur",
      package_unit: "box",
      sale_price_krw: 1000,
    }, 3);

    expect(item.name).toBe("Milling Bur");
    expect(item.current_qty).toBe(3);
  });

  it("검색은 원문과 정리된 이름 모두에서 찾는다", () => {
    const materials = [
      { source: "edent", source_product_id: "1", name: "[50%체험특가] CAD/CAM Milling Bur" },
      { source: "edent", source_product_id: "2", name: "멸균 파우치" },
    ];

    expect(searchMaterials(materials, "체험특가")).toHaveLength(1);
    expect(searchMaterials(materials, "CAD/CAM")).toHaveLength(1);
  });
});
