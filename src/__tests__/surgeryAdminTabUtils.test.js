import { describe, expect, it } from "vitest";
import {
  buildProjectedStockRows,
  buildSurgeryBulkShortageRows,
  buildSurgeryGuidance,
  buildTemplateGroups,
  isWithinNextDays,
  summarizeSurgery,
  usageDeltaText,
} from "../components/screens/AdminScreen/SurgeryAdminTab.utils";

const itemMapFrom = (items) => new Map(items.map(item => [item.id, item]));

describe("SurgeryAdminTab pure utilities", () => {
  it("수술 필요/실사용 비용과 부족 품목을 계산하고 안내 문구를 만든다", () => {
    const itemMap = itemMapFrom([
      { id: "fixture", name: "임플란트 픽스처", current_qty: 1, unit: "개", price: 10000 },
      { id: "missing-price", name: "단가 미등록", current_qty: 10, unit: "개", price: 0 },
    ]);
    const summary = summarizeSurgery({
      id: "s1",
      title: "오전 임플란트",
      required_items: [
        { item_id: "fixture", qty: 3 },
        { item_id: "missing-price", qty: 1 },
      ],
      actual_items: [
        { item_id: "fixture", qty: 4 },
      ],
    }, itemMap);

    expect(summary.expectedCost).toBe(30000);
    expect(summary.actualCost).toBe(40000);
    expect(summary.deltaCost).toBe(10000);
    expect(summary.shortageRows).toHaveLength(1);
    expect(summary.shortageRows[0]).toMatchObject({
      requiredQty: 3,
      currentQty: 1,
      shortageQty: 2,
    });
    expect(summary.unpricedCount).toBe(1);
    expect(summary.statusLabel).toBe("부족 1종");
    expect(usageDeltaText(summary)).toBe("실사용이 예상보다 10,000원 초과");

    expect(buildSurgeryGuidance(summary)).toMatchObject({
      prefix: "이유",
      reason: "임플란트 픽스처 필요 3개, 현재 1개라서 2개 부족 · 단가 없는 품목 1종이 예상 비용에서 빠짐 · 실사용이 예상보다 10,000원 초과",
      action: "보충 또는 준비 품목 조정 / 품목 단가 등록 / 추가 사용 원인 확인",
    });
  });

  it("준비 또는 사용 확인된 수술은 부족 경고를 비활성화한다", () => {
    const itemMap = itemMapFrom([
      { id: "gauze", name: "거즈", current_qty: 0, unit: "팩", price: 5000 },
    ]);

    const summary = summarizeSurgery({
      id: "s2",
      title: "발치",
      prep_confirmed: true,
      required_items: [{ item_id: "gauze", qty: 3 }],
      actual_items: [],
    }, itemMap);

    expect(summary.shortageRows).toEqual([]);
    expect(summary.shortageCount).toBe(0);
    expect(summary.statusLabel).toBe("사용량 대기");
    expect(buildSurgeryGuidance(summary)).toMatchObject({
      prefix: "안심",
      reason: "준비 확인 완료, 사용량 입력만 남음",
      action: "수술 후 사용량 확인",
    });
  });

  it("여러 수술의 부족 품목을 품목별로 합산하고 수술명 중복을 제거한다", () => {
    const itemMap = itemMapFrom([
      { id: "lidocaine", name: "리도카인", current_qty: 4, unit: "앰플" },
      { id: "gauze", name: "거즈", current_qty: 0, unit: "팩" },
    ]);
    const rows = buildSurgeryBulkShortageRows([
      {
        surgery: { id: "s1", title: "오전 수술" },
        requiredRows: [
          { item_id: "lidocaine", qty: 3 },
          { item_id: "lidocaine", qty: 2 },
        ],
      },
      {
        surgery: { id: "s2", title: "오후 수술" },
        requiredRows: [
          { item_id: "lidocaine", qty: 1 },
          { item_id: "gauze", qty: 1 },
        ],
      },
    ], itemMap);

    expect(rows.map(row => row.id)).toEqual(["lidocaine", "gauze"]);
    expect(rows[0]).toMatchObject({
      requiredQty: 6,
      currentQty: 4,
      shortageQty: 2,
      surgeryTitles: ["오전 수술", "오후 수술"],
    });
    expect(Array.from(rows[0].surgeryIds)).toEqual(["s1", "s2"]);
  });

  it("수술 후 최소재고 미달이 새로 생기는 품목을 우선 정렬한다", () => {
    const itemMap = itemMapFrom([
      { id: "suture", name: "봉합사", current_qty: 5, min_qty: 3, unit: "개" },
      { id: "blade", name: "블레이드", current_qty: 1, min_qty: 3, unit: "개" },
    ]);
    const rows = buildProjectedStockRows([
      {
        surgery: { id: "s1", title: "오전 수술" },
        requiredRows: [
          { item_id: "suture", qty: 4 },
          { item_id: "blade", qty: 1 },
        ],
      },
    ], itemMap);

    expect(rows.map(row => row.id)).toEqual(["suture", "blade"]);
    expect(rows[0]).toMatchObject({
      projectedQty: 1,
      beforeShortageQty: 0,
      afterShortageQty: 2,
      surgeryDrivenShortageQty: 2,
      isNewShortage: true,
    });
    expect(rows[1]).toMatchObject({
      projectedQty: 0,
      beforeShortageQty: 2,
      afterShortageQty: 3,
      surgeryDrivenShortageQty: 1,
      isNewShortage: false,
    });
  });

  it("템플릿 가이드와 날짜 범위를 안정적으로 계산한다", () => {
    const groups = buildTemplateGroups("implant", [
      { id: "27", name: "Fixture", unit: "개" },
      { id: "29", name: "Healing", unit: "개" },
    ]);

    expect(groups[0].items.slice(0, 3)).toEqual([
      { id: "27", name: "Fixture", unit: "개", qty: 1, registered: true },
      { id: "29", name: "Healing", unit: "개", qty: 1, registered: true },
      { id: "30", name: "품목 30", unit: "", qty: 1, registered: false },
    ]);
    expect(isWithinNextDays("2026-05-20", "2026-05-20", 7)).toBe(true);
    expect(isWithinNextDays("2026-05-26", "2026-05-20", 7)).toBe(true);
    expect(isWithinNextDays("2026-05-27", "2026-05-20", 7)).toBe(false);
    expect(isWithinNextDays("bad-date", "2026-05-20", 7)).toBe(false);
  });
});
