import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { ST } from "../../constants/itemStates";
import { settingsApi } from "../../api/settingsApi";
import { catColor, getActiveOrder, getStatus } from "../../utils/helpers";
import { resolveOrderVendorForQty } from "../../utils/vendorSelection";
import { Inp } from "../shared/Inp";

const buildInitialRows = (items, orders) =>
  items
    .filter(item => getStatus(item) !== "ok")
    .map(item => ({
      item,
      qty: Math.max(1, item.min_qty - item.current_qty),
      selected: !getActiveOrder(orders, item.id),
      blocked: Boolean(getActiveOrder(orders, item.id)),
    }));

export function BulkOrderRequestSheet({ items, orders, onSubmit, onClose }) {
  const [rows, setRows] = useState(() => buildInitialRows(items, orders));
  const [note, setNote] = useState("부족 품목 일괄 발주");
  const settings = useMemo(() => settingsApi.load(), []);
  const vendorByItemId = useMemo(() => new Map(rows.map(row => [row.item.id, resolveOrderVendorForQty(row.item, settings, row.qty)])), [rows, settings]);

  const selectedRows = useMemo(() => rows.filter(row => row.selected && !row.blocked), [rows]);
  const blockedCount = rows.filter(row => row.blocked).length;

  const updateQty = (itemId, nextQty) => {
    setRows(prev => prev.map(row => row.item.id === itemId
      ? { ...row, qty: Math.max(1, Number(nextQty) || 1) }
      : row
    ));
  };

  const toggleRow = (itemId) => {
    setRows(prev => prev.map(row => row.item.id === itemId && !row.blocked
      ? { ...row, selected: !row.selected }
      : row
    ));
  };

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.grey900 }}>부족 품목 발주</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: T.grey500, lineHeight: 1.45 }}>
            필요한 품목만 남기고 수량을 조정하세요.
          </p>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 6 }}>
          <X size={24} color={T.grey500} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: T.blue50, color: T.blue500 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>선택</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, fontFamily: monoFont }}>{selectedRows.length}건</p>
        </div>
        <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: T.grey100, color: T.grey700 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>중복 제외</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, fontFamily: monoFont }}>{blockedCount}건</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {rows.map(row => {
          const status = getStatus(row.item);
          return (
            <div
              key={row.item.id}
              style={{
                border: `1px solid ${row.selected ? `${T.blue500}55` : T.grey200}`,
                background: row.blocked ? T.grey50 : T.white,
                borderRadius: 12,
                padding: 14,
                opacity: row.blocked ? 0.72 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => toggleRow(row.item.id)}
                  disabled={row.blocked}
                  aria-label={`${row.item.name} 선택`}
                  style={{
                    width: 24,
                    height: 24,
                    marginTop: 2,
                    borderRadius: 9999,
                    border: `1px solid ${row.selected ? T.blue500 : T.grey300}`,
                    background: row.selected ? T.blue500 : T.white,
                    color: T.white,
                    cursor: row.blocked ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {row.selected && <Check size={15} color={T.white} strokeWidth={3} />}
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: catColor(row.item.category_id), flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                      {row.item.name}
                    </p>
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 13, color: T.grey500 }}>
                    현재 <span style={{ color: ST[status].text, fontWeight: 700 }}>{row.item.current_qty}{row.item.unit}</span>
                    <span style={{ color: T.grey400 }}> · 최소 {row.item.min_qty}{row.item.unit}</span>
                    {row.blocked && <span style={{ color: T.grey500 }}> · 발주 진행 중</span>}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: T.grey500 }}>
                    예상 거래처 <span style={{ fontWeight: 700, color: T.grey700 }}>{vendorByItemId.get(row.item.id)?.vendor_name || "거래처 미정"}</span>
                    {vendorByItemId.get(row.item.id)?.vendor_price && <span> · {vendorByItemId.get(row.item.id).vendor_price.toLocaleString()}원</span>}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  disabled={row.blocked}
                  onClick={() => updateQty(row.item.id, row.qty - 1)}
                  style={{ width: 36, height: 36, borderRadius: 9999, border: `1px solid ${T.grey200}`, background: T.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: row.blocked ? "default" : "pointer" }}
                >
                  <Minus size={16} color={T.grey700} />
                </button>
                <div style={{ minWidth: 72, textAlign: "center", fontSize: 18, fontWeight: 700, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>
                  {row.qty}{row.item.unit}
                </div>
                <button
                  type="button"
                  disabled={row.blocked}
                  onClick={() => updateQty(row.item.id, row.qty + 1)}
                  style={{ width: 36, height: 36, borderRadius: 9999, border: "none", background: row.blocked ? T.grey200 : T.blue500, display: "flex", alignItems: "center", justifyContent: "center", cursor: row.blocked ? "default" : "pointer" }}
                >
                  <Plus size={16} color={row.blocked ? T.grey500 : T.white} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: T.grey700 }}>공통 메모</p>
      <Inp value={note} onChange={e => setNote(e.target.value)} placeholder="예: 부족 품목 일괄 보충" style={{ marginBottom: 16 }} />

      <div style={{ position: "sticky", bottom: -32, margin: "0 -20px -32px", padding: "12px 20px 20px", background: T.white, borderTop: `1px solid ${T.grey100}` }}>
        <button
          type="button"
          disabled={!selectedRows.length}
          onClick={() => onSubmit(selectedRows.map(({ item, qty }) => ({ item, qty })), note)}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 9999,
            border: "none",
            background: selectedRows.length ? T.blue500 : T.grey200,
            color: selectedRows.length ? T.white : T.grey500,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: font,
            cursor: selectedRows.length ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ShoppingCart size={18} />
          선택한 품목 발주 요청
        </button>
      </div>
    </div>
  );
}
