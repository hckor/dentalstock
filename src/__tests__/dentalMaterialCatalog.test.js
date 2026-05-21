import { describe, expect, it } from "vitest";
import {
  cleanMaterialName,
  filterMaterials,
  getMaterialCategoryOptions,
  getMaterialTypeLabel,
  getMaterialTypeOptions,
  groupMaterialsByCategoryAndType,
  inferMaterialCategoryId,
  inferMaterialUnit,
  materialToInventoryItem,
  searchMaterials,
} from "../utils/dentalMaterialCatalog";

describe("dental material catalog", () => {
  it("카탈로그 표시/저장용 이름에서 쇼핑몰 판촉 문구를 제거한다", () => {
    expect(cleanMaterialName("[50%체험특가] [밀링머신전용] CAD/CAM Milling Bur")).toBe("CAD/CAM Milling Bur");
    expect(cleanMaterialName("#신제품 멸균 파우치")).toBe("멸균 파우치");
    expect(cleanMaterialName("[선주문 할인 이벤트!]ECO GLOVE 40박스")).toBe("ECO GLOVE 40박스");
    expect(cleanMaterialName("Ecolight X DUAL LED 구매시 dia-fil flow 레진 8개 증정 이벤트!")).toBe("Ecolight X DUAL LED");
    expect(cleanMaterialName("[반품불가] 프로세이프 KF-94마스크")).toBe("프로세이프 KF-94마스크");
    expect(cleanMaterialName("[100봉 미만 주문]뉴 그린 믹싱팁 50EA")).toBe("뉴 그린 믹싱팁 50EA");
    expect(cleanMaterialName("(유통기한 임박) 하이큐 서지칼 글러브")).toBe("하이큐 서지칼 글러브");
  });

  it("품목명과 카테고리 키워드로 앱 카테고리를 추론한다", () => {
    expect(inferMaterialCategoryId({ name: "멸균 파우치" })).toBe(1);
    expect(inferMaterialCategoryId({ name: "리도카인 에피 앰플" })).toBe(2);
    expect(inferMaterialCategoryId({ name: "임플란트 픽스처 4.5mm" })).toBe(3);
    expect(inferMaterialCategoryId({ name: "LED 큐링 라이트" })).toBe(4);
  });

  it("패키지와 규격에서 단위를 추론한다", () => {
    expect(inferMaterialUnit({ package_unit: "10박스" })).toBe("박스");
    expect(inferMaterialUnit({ package_unit: "pkg/2.5mL x 1EA" })).toBe("팩");
    expect(inferMaterialUnit({ spec: "syringe 20ea + Tip 20ea" })).toBe("시린지");
    expect(inferMaterialUnit({ package_unit: "SET" })).toBe("세트");
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

  it("정규화된 카탈로그의 거래처 옵션을 가격 비교용 데이터로 보존한다", () => {
    const item = materialToInventoryItem({
      catalog_id: "dm-test",
      name: "[특가] 멸균 파우치",
      display_name: "멸균 파우치",
      category_id: 1,
      unit: "팩",
      vendor_options: [
        {
          vendor_id: "dental365",
          vendor_name: "덴탈365",
          product_code: "A-100",
          price: 12000,
          url: "https://example.com/a",
        },
        {
          vendor_id: "jdent",
          vendor_name: "제이덴트",
          product_code: "B-200",
          price: 11000,
          url: "https://example.com/b",
        },
      ],
    }, 5);

    expect(item.name).toBe("멸균 파우치");
    expect(item.vendor_options).toHaveLength(2);
    expect(item.vendor_options[1]).toMatchObject({
      vendor_id: "jdent",
      vendor_name: "제이덴트",
      product_code: "B-200",
      price: 11000,
      url: "https://example.com/b",
    });
  });

  it("검색은 원문과 정리된 이름 모두에서 찾는다", () => {
    const materials = [
      { source: "edent", source_product_id: "1", name: "[50%체험특가] CAD/CAM Milling Bur" },
      {
        catalog_id: "dm-2",
        name: "#신제품 멸균 파우치",
        display_name: "멸균 파우치",
        search_keywords: ["sterilization pouch", "파우치"],
        vendor_options: [{ vendor_name: "덴탈365", product_code: "P-100" }],
      },
    ];

    expect(searchMaterials(materials, "체험특가")).toHaveLength(1);
    expect(searchMaterials(materials, "CAD/CAM")).toHaveLength(1);
    expect(searchMaterials(materials, "P-100")).toHaveLength(1);
    expect(searchMaterials(materials, "sterilization")).toHaveLength(1);
  });

  it("카테고리와 종류 기준으로 필터 옵션과 묶음을 만든다", () => {
    const materials = [
      {
        catalog_id: "dm-1",
        name: "멸균 파우치",
        category: "소모품",
        source_category: "감염관리 > 멸균 파우치",
        manufacturer: "A",
      },
      {
        catalog_id: "dm-2",
        name: "니트릴 장갑",
        category: "소모품",
        source_category: "글러브/마스크/에이프런/소공포/실드",
        manufacturer: "B",
      },
      {
        catalog_id: "dm-3",
        name: "리도카인",
        category: "의약품",
        source_category: "마취제",
        manufacturer: "C",
      },
    ];

    expect(getMaterialTypeLabel(materials[0])).toBe("멸균 파우치");
    expect(getMaterialCategoryOptions(materials)).toEqual([
      { value: "소모품", label: "소모품", count: 2 },
      { value: "의약품", label: "의약품", count: 1 },
    ]);
    expect(getMaterialTypeOptions(materials, "소모품").map(option => option.value)).toEqual([
      "글러브/마스크/에이프런/소공포/실드",
      "멸균 파우치",
    ]);

    const filtered = filterMaterials(materials, { category: "소모품", type: "멸균 파우치" });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0].name).toBe("멸균 파우치");
    expect(groupMaterialsByCategoryAndType(filtered.items)).toEqual([
      {
        key: "소모품::멸균 파우치",
        category: "소모품",
        type: "멸균 파우치",
        items: [materials[0]],
      },
    ]);
  });
});
