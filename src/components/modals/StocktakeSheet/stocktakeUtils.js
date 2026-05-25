import { catName } from "../../../utils/helpers";

export function parseQty(value) {
  const number = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function formatDelta(delta, unit) {
  if (delta === 0) return "변화 없음";
  return `${delta > 0 ? "+" : ""}${delta}${unit}`;
}

export function getLargeDiffThreshold(beforeQty) {
  return Math.max(3, Math.ceil(Math.max(beforeQty, 1) * 0.2));
}

export function pct(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function buildStocktakeRows(items, draft, checkedIds) {
  return items.map(item => {
    const beforeQty = Number(item.current_qty) || 0;
    const nextQty = parseQty(draft[item.id]);
    const delta = nextQty - beforeQty;
    const checked = checkedIds.has(item.id) || delta !== 0;
    return {
      item,
      beforeQty,
      nextQty,
      delta,
      checked,
      largeDiff: delta !== 0 && Math.abs(delta) >= getLargeDiffThreshold(beforeQty),
      category: catName(item.category_id),
      location: item.location || "위치 없음",
    };
  });
}

export function filterAndSortStocktakeRows(rows, { query, priorityFirst }) {
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? rows.filter(({ item, category, location }) => {
      const haystack = `${item.name || ""} ${location} ${item.unit || ""} ${category}`.toLowerCase();
      return haystack.includes(keyword);
    })
    : rows;

  return [...filtered].sort((a, b) => {
    if (!priorityFirst) return a.item.name.localeCompare(b.item.name, "ko");
    return Number(b.largeDiff) - Number(a.largeDiff) ||
      Math.abs(b.delta) - Math.abs(a.delta) ||
      Number(a.checked) - Number(b.checked) ||
      a.item.name.localeCompare(b.item.name, "ko");
  });
}

export function buildGroups(rows, groupBy) {
  if (groupBy === "all") return [{ key: "all", label: "", rows }];
  const map = new Map();
  rows.forEach(row => {
    const key = groupBy === "category" ? row.category : row.location;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return Array.from(map.entries()).map(([key, groupRows]) => ({
    key,
    label: key,
    rows: groupRows,
  }));
}

export function summarizeStocktakeRows(rows, totalCount) {
  const checkedCount = rows.filter(row => row.checked).length;
  const changedRows = rows.filter(row => row.delta !== 0);
  const plusQty = changedRows.filter(row => row.delta > 0).reduce((sum, row) => sum + row.delta, 0);
  const minusQty = changedRows.filter(row => row.delta < 0).reduce((sum, row) => sum + Math.abs(row.delta), 0);
  return {
    checkedCount,
    completion: pct(checkedCount, totalCount),
    changeCount: changedRows.length,
    plusQty,
    minusQty,
    largeDiffCount: rows.filter(row => row.largeDiff).length,
  };
}
