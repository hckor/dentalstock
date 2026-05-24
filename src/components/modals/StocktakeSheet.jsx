import { useMemo, useState } from "react";
import { Check, ClipboardCheck, Layers3, MapPin, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { auditLogsApi } from "../../api/auditLogsApi";
import { supabaseItemsApi } from "../../api/supabaseItemsApi";
import { T, font, monoFont } from "../../constants/colors";
import { catName } from "../../utils/helpers";

function parseQty(value) {
  const number = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatDelta(delta, unit) {
  if (delta === 0) return "변화 없음";
  return `${delta > 0 ? "+" : ""}${delta}${unit}`;
}

function getLargeDiffThreshold(beforeQty) {
  return Math.max(3, Math.ceil(Math.max(beforeQty, 1) * 0.2));
}

function pct(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function buildGroups(rows, groupBy) {
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

export function StocktakeSheet({ items, setItems, setTxs, currentUser, onClose, showToast }) {
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("all");
  const [priorityFirst, setPriorityFirst] = useState(true);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(items.map(item => [item.id, String(item.current_qty ?? 0)]))
  );
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => items.map(item => {
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
  }), [items, draft, checkedIds]);

  const visibleRows = useMemo(() => {
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
  }, [rows, query, priorityFirst]);

  const groupedRows = useMemo(() => buildGroups(visibleRows, groupBy), [visibleRows, groupBy]);

  const stocktakeSummary = useMemo(() => {
    const checkedCount = rows.filter(row => row.checked).length;
    const changedRows = rows.filter(row => row.delta !== 0);
    const plusQty = changedRows.filter(row => row.delta > 0).reduce((sum, row) => sum + row.delta, 0);
    const minusQty = changedRows.filter(row => row.delta < 0).reduce((sum, row) => sum + Math.abs(row.delta), 0);
    return {
      checkedCount,
      completion: pct(checkedCount, items.length),
      changeCount: changedRows.length,
      plusQty,
      minusQty,
      largeDiffCount: rows.filter(row => row.largeDiff).length,
    };
  }, [rows, items.length]);

  const changes = useMemo(() => rows.filter(row => row.delta !== 0), [rows]);

  const markChecked = (itemId) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const toggleChecked = (itemId) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const setQty = (itemId, value) => {
    markChecked(itemId);
    setDraft(prev => ({ ...prev, [itemId]: String(parseQty(value)) }));
  };

  const adjustQty = (item, delta) => {
    const current = parseQty(draft[item.id]);
    setQty(item.id, current + delta);
  };

  const save = async () => {
    if (saving) return;
    if (changes.length === 0) {
      showToast?.("변경된 수량이 없습니다");
      return;
    }

    const checkedAt = new Date().toISOString();
    setSaving(true);
    try {
      if (supabaseItemsApi.isEnabled()) {
        if (!currentUser?.clinicId) throw new Error("clinic_required");
        const savedItems = await supabaseItemsApi.saveStocktakeAdjustments({
          clinicId: currentUser.clinicId,
          actorId: currentUser.supabaseUserId || currentUser.id,
          changes: changes.map(change => ({
            ...change,
            reason: `재고실사 보정 (${change.beforeQty} → ${change.nextQty})`,
            checkedAt,
          })),
        });
        const savedById = new Map(savedItems.map(item => [item.id, item]));
        setItems(prev => prev.map(item => savedById.get(item.id) || item));
      } else {
        const nextQtyById = new Map(changes.map(change => [change.item.id, change.nextQty]));
        setItems(prev => prev.map(item =>
          nextQtyById.has(item.id) ? { ...item, current_qty: nextQtyById.get(item.id), last_stocktake_at: checkedAt } : item
        ));
      }

      setTxs(prev => [
        ...changes.map(change => ({
          id: `t${Date.now()}-${change.item.id}`,
          item_id: change.item.id,
          type: "adjust",
          qty: Math.abs(change.delta),
          delta: change.delta,
          before_qty: change.beforeQty,
          after_qty: change.nextQty,
          note: `재고실사 보정 (${change.beforeQty}${change.item.unit} → ${change.nextQty}${change.item.unit})`,
          created_at: checkedAt,
          user: currentUser?.name || "system",
        })),
        ...prev,
      ]);

      changes.forEach(change => {
        auditLogsApi.record({
          action: "stock.adjust",
          entityType: "item",
          entityId: change.item.id,
          actor: currentUser,
          at: checkedAt,
          metadata: {
            item_name: change.item.name,
            qty: Math.abs(change.delta),
            delta: change.delta,
            before_qty: change.beforeQty,
            after_qty: change.nextQty,
            reason: "stocktake",
          },
        });
      });

      showToast?.(`재고 ${changes.length}개 품목을 보정했습니다`);
      onClose?.();
    } catch (error) {
      console.error("Failed to save stocktake", error);
      showToast?.("재고실사 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const groupOptions = [
    { id: "all", label: "전체", Icon: SlidersHorizontal },
    { id: "category", label: "카테고리", Icon: Layers3 },
    { id: "location", label: "위치", Icon: MapPin },
  ];

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, lineHeight: "30px", fontWeight: 700, color: T.grey900 }}>재고실사</h2>
          <p style={{ margin: "3px 0 0", fontSize: 14, lineHeight: "20px", color: T.grey500 }}>
            선반에서 확인한 실제 수량과 차이 큰 품목을 먼저 정리합니다.
          </p>
        </div>
        <button aria-label="닫기" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
          <X size={24} color={T.grey500} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={{ background: T.blue50, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: T.blue500, fontWeight: 700 }}>완료율</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, lineHeight: "30px", color: T.blue500, fontWeight: 700, fontFamily: monoFont }}>{stocktakeSummary.completion}%</p>
          <p style={{ margin: "1px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey600 }}>{stocktakeSummary.checkedCount}/{items.length} 확인</p>
        </div>
        <div style={{ background: stocktakeSummary.largeDiffCount > 0 ? T.red50 : T.grey100, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: stocktakeSummary.largeDiffCount > 0 ? T.red500 : T.grey600, fontWeight: 700 }}>차이 큰 품목</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, lineHeight: "30px", color: stocktakeSummary.largeDiffCount > 0 ? T.red500 : T.grey900, fontWeight: 700, fontFamily: monoFont }}>{stocktakeSummary.largeDiffCount}</p>
          <p style={{ margin: "1px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey600 }}>우선 재확인 권장</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "보정 품목", value: stocktakeSummary.changeCount, color: T.grey900, bg: T.grey100 },
          { label: "증가 합계", value: `+${stocktakeSummary.plusQty}`, color: T.blue500, bg: T.blue50 },
          { label: "감소 합계", value: `-${stocktakeSummary.minusQty}`, color: T.red500, bg: T.red50 },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "10px 10px" }}>
            <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", color: T.grey600, fontWeight: 700 }}>{card.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: 19, lineHeight: "25px", color: card.color, fontWeight: 700, fontFamily: monoFont }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={18} color={T.grey400} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="품목명, 위치, 카테고리 검색"
          style={{ width: "100%", height: 46, border: `1px solid ${T.inputBorder}`, borderRadius: 12, background: T.inputBg, padding: "0 14px 0 42px", boxSizing: "border-box", color: T.textStrong, fontFamily: font, fontSize: 16, outlineColor: T.primary }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {groupOptions.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setGroupBy(id)}
            style={{ flex: 1, minHeight: 40, border: "none", borderRadius: 9999, background: groupBy === id ? T.grey900 : T.grey100, color: groupBy === id ? T.white : T.grey700, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPriorityFirst(value => !value)}
        style={{ width: "100%", marginBottom: 12, minHeight: 40, border: `1px solid ${priorityFirst ? T.blue500 + "55" : T.grey200}`, borderRadius: 9999, background: priorityFirst ? T.blue50 : T.white, color: priorityFirst ? T.blue500 : T.grey600, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        {priorityFirst ? "차이 큰 품목과 미확인 품목 우선" : "품목명 순서로 보기"}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "42vh", overflowY: "auto", paddingBottom: 12 }}>
        {groupedRows.map(group => (
          <div key={group.key}>
            {group.label && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 2px 7px" }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", fontWeight: 700, color: T.grey700 }}>{group.label}</p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: T.grey500 }}>
                  {group.rows.filter(row => row.checked).length}/{group.rows.length} 확인
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.rows.map(row => {
                const { item } = row;
                const currentDraft = parseQty(draft[item.id]);
                return (
                  <div key={item.id} style={{ border: `1px solid ${row.delta !== 0 ? T.blue500 + "55" : row.checked ? T.green500 + "44" : T.grey200}`, borderRadius: 12, background: row.delta !== 0 ? T.blue50 : row.checked ? T.green50 : T.white, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <button
                        type="button"
                        aria-label={`${item.name} 확인 상태`}
                        onClick={() => toggleChecked(item.id)}
                        style={{ width: 32, height: 32, borderRadius: 9999, border: "none", background: row.delta !== 0 ? T.blue500 : row.checked ? T.green500 : T.grey100, color: row.delta !== 0 || row.checked ? T.white : T.grey500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
                      >
                        {row.delta !== 0 || row.checked ? <Check size={16} /> : <ClipboardCheck size={16} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 700, color: T.grey900, overflowWrap: "anywhere", wordBreak: "keep-all" }}>{item.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey500 }}>
                          현재 {item.current_qty}{item.unit} · {row.category} · {row.location}
                        </p>
                        {row.largeDiff && (
                          <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "17px", color: T.red500, fontWeight: 700 }}>
                            차이가 큽니다. 저장 전 한 번 더 확인해주세요.
                          </p>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 13, lineHeight: "20px", fontWeight: 700, color: row.delta !== 0 ? (row.delta > 0 ? T.blue500 : T.red500) : row.checked ? T.green500 : T.grey500, fontFamily: monoFont }}>
                        {formatDelta(row.delta, item.unit)}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "42px 1fr 42px", gap: 8, alignItems: "center" }}>
                      <button type="button" onClick={() => adjustQty(item, -1)} style={{ height: 42, borderRadius: 9999, border: `1px solid ${T.grey200}`, background: T.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Minus size={18} color={T.grey700} />
                      </button>
                      <input
                        value={currentDraft}
                        onChange={event => setQty(item.id, event.target.value)}
                        inputMode="numeric"
                        aria-label={`${item.name} 실제 수량`}
                        style={{ minWidth: 0, height: 42, border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", fontSize: 18, fontWeight: 700, textAlign: "center", outlineColor: T.blue500 }}
                      />
                      <button type="button" onClick={() => adjustQty(item, 1)} style={{ height: 42, borderRadius: 9999, border: "none", background: T.blue500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus size={18} color={T.white} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {visibleRows.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", color: T.grey500, fontSize: 15 }}>
            검색 결과가 없어요.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving || changes.length === 0}
        style={{ width: "100%", padding: "16px 0", borderRadius: 9999, border: "none", background: saving || changes.length === 0 ? T.grey200 : T.blue500, color: saving || changes.length === 0 ? T.grey500 : T.white, fontFamily: font, fontSize: 16, fontWeight: 700, cursor: saving || changes.length === 0 ? "default" : "pointer" }}
      >
        {saving ? "저장 중..." : changes.length > 0 ? `${changes.length}개 보정 저장` : "변경된 수량 없음"}
      </button>
    </div>
  );
}
