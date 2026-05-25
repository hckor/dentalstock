import { Check, ClipboardCheck, Minus, Plus } from "lucide-react";
import { T, monoFont } from "../../../constants/colors";
import { formatDelta, parseQty } from "./stocktakeUtils";

export function StocktakeRows({ groupedRows, visibleRows, draft, setQty, adjustQty, toggleChecked }) {
  return (
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
  );
}
