import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { auditLogsApi } from "../../api/auditLogsApi";
import { supabaseItemsApi } from "../../api/supabaseItemsApi";
import { T, font } from "../../constants/colors";
import { handleAppError } from "../../utils/errorHandling";
import { StocktakeControls } from "./StocktakeSheet/StocktakeControls";
import { StocktakeRows } from "./StocktakeSheet/StocktakeRows";
import { StocktakeSummary } from "./StocktakeSheet/StocktakeSummary";
import {
  buildGroups,
  buildStocktakeRows,
  filterAndSortStocktakeRows,
  parseQty,
  summarizeStocktakeRows,
} from "./StocktakeSheet/stocktakeUtils";

export function StocktakeSheet({ items, setItems, setTxs, currentUser, onClose, showToast }) {
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("all");
  const [priorityFirst, setPriorityFirst] = useState(true);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(items.map(item => [item.id, String(item.current_qty ?? 0)]))
  );
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => buildStocktakeRows(items, draft, checkedIds), [items, draft, checkedIds]);

  const visibleRows = useMemo(() => {
    return filterAndSortStocktakeRows(rows, { query, priorityFirst });
  }, [rows, query, priorityFirst]);

  const groupedRows = useMemo(() => buildGroups(visibleRows, groupBy), [visibleRows, groupBy]);
  const stocktakeSummary = useMemo(() => summarizeStocktakeRows(rows, items.length), [rows, items.length]);

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
      handleAppError(error, {
        context: "stocktake.save",
        userMessage: "재고실사 저장에 실패했습니다",
        showToast,
      });
    } finally {
      setSaving(false);
    }
  };

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

      <StocktakeSummary summary={stocktakeSummary} totalCount={items.length} />
      <StocktakeControls
        query={query}
        setQuery={setQuery}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        priorityFirst={priorityFirst}
        setPriorityFirst={setPriorityFirst}
      />
      <StocktakeRows
        groupedRows={groupedRows}
        visibleRows={visibleRows}
        draft={draft}
        setQty={setQty}
        adjustQty={adjustQty}
        toggleChecked={toggleChecked}
      />

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
