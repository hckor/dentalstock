import { T } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { formatMoney, itemUnitPrice, toNumber } from "../../../utils/money";

export const WEEK_WINDOW_DAYS = 7;
export const rowItems = (rows) => Array.isArray(rows) ? rows : [];

export function summarizeSurgery(surgery, itemMap) {
  const requiredRows = rowItems(surgery.required_items);
  const actualRows = rowItems(surgery.actual_items);
  const expectedCost = requiredRows.reduce((sum, row) => sum + itemUnitPrice(itemMap.get(row.item_id)) * toNumber(row.qty), 0);
  const actualCost = actualRows.reduce((sum, row) => sum + itemUnitPrice(itemMap.get(row.item_id)) * toNumber(row.qty), 0);
  const rawShortageRows = requiredRows
    .map(row => {
      const item = itemMap.get(row.item_id);
      const requiredQty = toNumber(row.qty);
      const currentQty = toNumber(item?.current_qty);
      return {
        row,
        item,
        requiredQty,
        currentQty,
        shortageQty: Math.max(0, requiredQty - currentQty),
      };
    })
    .filter(row => !row.item || row.shortageQty > 0);
  const shortageRows = surgery.prep_confirmed || surgery.usage_confirmed ? [] : rawShortageRows;
  const unpricedCount = requiredRows.filter(row => itemUnitPrice(itemMap.get(row.item_id)) <= 0).length;
  const hasActual = actualRows.length > 0 || surgery.usage_confirmed;
  const deltaCost = hasActual ? actualCost - expectedCost : 0;
  const hasShortage = shortageRows.length > 0;
  const statusLabel = surgery.usage_confirmed
    ? "사용확인"
    : surgery.prep_confirmed
      ? "사용량 대기"
      : hasShortage
        ? `부족 ${shortageRows.length}종`
        : "준비 가능";

  return {
    surgery,
    requiredRows,
    actualRows,
    expectedCost,
    actualCost,
    deltaCost,
    hasActual,
    shortageRows,
    shortageCount: shortageRows.length,
    unpricedCount,
    statusLabel,
    statusColor: surgery.usage_confirmed ? T.green500 : hasShortage ? T.red500 : surgery.prep_confirmed ? T.orange500 : T.green500,
    statusBg: surgery.usage_confirmed ? T.green50 : hasShortage ? T.red50 : surgery.prep_confirmed ? T.orange50 : T.green50,
  };
}

export function shortageReason(summary) {
  const firstRisk = summary.shortageRows?.[0];
  if (!firstRisk) return "";
  if (!firstRisk.item) return "준비 목록에 삭제된 품목이 포함됨";
  const unit = firstRisk.item.unit || "";
  const moreText = summary.shortageCount > 1 ? ` 외 ${summary.shortageCount - 1}종` : "";
  return `${firstRisk.item.name} 필요 ${firstRisk.requiredQty}${unit}, 현재 ${firstRisk.currentQty}${unit}라서 ${firstRisk.shortageQty}${unit} 부족${moreText}`;
}

export function usageDeltaText(summary) {
  if (!summary.hasActual || summary.deltaCost === 0) return "";
  const direction = summary.deltaCost > 0 ? "초과" : "절감";
  return `실사용이 예상보다 ${formatMoney(Math.abs(summary.deltaCost))} ${direction}`;
}

export function buildSurgeryGuidance(summary) {
  const reasons = [];
  const actions = [];
  const hasShortage = summary.shortageCount > 0;
  const hasUnpriced = summary.unpricedCount > 0;
  const hasUsageGap = summary.hasActual && summary.deltaCost !== 0;

  if (hasShortage) {
    reasons.push(shortageReason(summary));
    actions.push("보충 또는 준비 품목 조정");
  }
  if (hasUnpriced) {
    reasons.push(`단가 없는 품목 ${summary.unpricedCount}종이 예상 비용에서 빠짐`);
    actions.push("품목 단가 등록");
  }
  if (hasUsageGap) {
    reasons.push(usageDeltaText(summary));
    actions.push(summary.deltaCost > 0 ? "추가 사용 원인 확인" : "절감 사유 기록");
  }
  if (summary.hasActual && summary.deltaCost === 0) {
    reasons.push("실사용이 예상과 일치");
  }

  if (reasons.length === 0) {
    if (summary.surgery?.usage_confirmed) reasons.push("사용량 확정까지 완료됨");
    else if (summary.surgery?.prep_confirmed) reasons.push("준비 확인 완료, 사용량 입력만 남음");
    else reasons.push("필요 재고와 단가가 확인됨");
  }
  if (actions.length === 0) {
    if (summary.surgery?.usage_confirmed) actions.push("기록 유지");
    else if (summary.surgery?.prep_confirmed) actions.push("수술 후 사용량 확인");
    else actions.push("예정 시간 전 최종 준비 확인");
  }

  return {
    prefix: hasShortage || hasUnpriced || hasUsageGap ? "이유" : "안심",
    reason: reasons.filter(Boolean).join(" · "),
    action: [...new Set(actions)].join(" / "),
    tone: hasShortage ? T.red500 : hasUnpriced || hasUsageGap ? T.orange500 : T.green500,
  };
}

const TEMPLATE_GUIDE = {
  implant: [
    { label: "핵심 품목", tone: "primary", itemIds: ["27", "29", "30", "11"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["31", "32", "12"] },
    { label: "누락 주의", tone: "warning", itemIds: ["27", "29", "30"] },
  ],
  prostho: [
    { label: "핵심 품목", tone: "primary", itemIds: ["22", "24", "25"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["23", "26", "19"] },
    { label: "누락 주의", tone: "warning", itemIds: ["24", "25", "11"] },
  ],
  extraction: [
    { label: "핵심 품목", tone: "primary", itemIds: ["6", "11", "9"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["12", "15", "14"] },
    { label: "누락 주의", tone: "warning", itemIds: ["6", "11", "12"] },
  ],
};

export function isWithinNextDays(value, today, days) {
  if (!value) return false;
  const target = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return false;
  const diffDays = Math.floor((target.getTime() - base.getTime()) / 86400000);
  return diffDays >= 0 && diffDays < days;
}

export function buildTemplateGroups(type, items) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const presetQtyById = new Map(rowItems(SURGERY_PRESETS[type]?.items).map(row => [row.item_id, toNumber(row.qty)]));
  return rowItems(TEMPLATE_GUIDE[type]).map(group => ({
    ...group,
    items: group.itemIds.map(itemId => {
      const item = itemMap.get(itemId);
      const qty = presetQtyById.get(itemId);
      return {
        id: itemId,
        name: item?.name || `품목 ${itemId}`,
        unit: item?.unit || "",
        qty,
        registered: Boolean(item),
      };
    }),
  }));
}

export function buildSurgeryBulkShortageRows(summaries, itemMap) {
  const rowsByItemId = new Map();

  summaries.forEach(summary => {
    summary.requiredRows.forEach(row => {
      const item = itemMap.get(row.item_id);
      const existing = rowsByItemId.get(row.item_id) || {
        id: row.item_id,
        item,
        requiredQty: 0,
        currentQty: toNumber(item?.current_qty),
        unit: item?.unit || "",
        surgeryTitles: [],
        surgeryIds: new Set(),
      };
      existing.requiredQty += toNumber(row.qty);
      if (!existing.surgeryIds.has(summary.surgery.id)) {
        existing.surgeryIds.add(summary.surgery.id);
        existing.surgeryTitles.push(summary.surgery.title);
      }
      rowsByItemId.set(row.item_id, existing);
    });
  });

  return Array.from(rowsByItemId.values())
    .map(row => ({
      ...row,
      shortageQty: Math.max(0, row.requiredQty - row.currentQty),
    }))
    .filter(row => !row.item || row.shortageQty > 0)
    .sort((a, b) => b.shortageQty - a.shortageQty || b.requiredQty - a.requiredQty || String(a.item?.name || a.id).localeCompare(String(b.item?.name || b.id), "ko-KR"));
}

export function buildProjectedStockRows(summaries, itemMap) {
  const rowsByItemId = new Map();

  summaries.forEach(summary => {
    summary.requiredRows.forEach(row => {
      const item = itemMap.get(row.item_id);
      const existing = rowsByItemId.get(row.item_id) || {
        id: row.item_id,
        item,
        requiredQty: 0,
        currentQty: toNumber(item?.current_qty),
        minQty: toNumber(item?.min_qty),
        unit: item?.unit || "",
        surgeryTitles: [],
        surgeryIds: new Set(),
      };
      existing.requiredQty += toNumber(row.qty);
      if (!existing.surgeryIds.has(summary.surgery.id)) {
        existing.surgeryIds.add(summary.surgery.id);
        existing.surgeryTitles.push(summary.surgery.title);
      }
      rowsByItemId.set(row.item_id, existing);
    });
  });

  return Array.from(rowsByItemId.values())
    .map(row => {
      const projectedQty = row.currentQty - row.requiredQty;
      const beforeShortageQty = Math.max(0, row.minQty - row.currentQty);
      const afterShortageQty = Math.max(0, row.minQty - projectedQty);
      const surgeryDrivenShortageQty = Math.max(0, afterShortageQty - beforeShortageQty);
      return {
        ...row,
        projectedQty,
        beforeShortageQty,
        afterShortageQty,
        surgeryDrivenShortageQty,
        isNewShortage: beforeShortageQty === 0 && afterShortageQty > 0,
      };
    })
    .filter(row => !row.item || row.afterShortageQty > 0)
    .sort((a, b) =>
      b.surgeryDrivenShortageQty - a.surgeryDrivenShortageQty ||
      b.afterShortageQty - a.afterShortageQty ||
      b.requiredQty - a.requiredQty ||
      String(a.item?.name || a.id).localeCompare(String(b.item?.name || b.id), "ko-KR")
    );
}

export function projectedStockAction(row) {
  if (!row.item) return "삭제된 품목을 준비 목록에서 교체";
  if (row.isNewShortage) return "수술 전 선발주 또는 대체 재료 확보";
  if (row.surgeryDrivenShortageQty > 0) return "기존 부족분에 수술 사용량까지 포함해 보충";
  return "현재 부족 품목 보충 후 수술 준비";
}
