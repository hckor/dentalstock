import { useMemo, useState } from "react";
import { CheckCircle2, Minus, PackageCheck, Plus, X } from "lucide-react";
import { T, font, monoFont } from "../../constants/colors";
import { Inp } from "../shared/Inp";

export function BulkReceiptConfirmSheet({ orders, items, onConfirm, onClose }) {
  const initialRows = useMemo(() => (Array.isArray(orders) ? orders : [])
    .map(order => {
      const item = items.find(target => target.id === order.item_id);
      const remainingQty = Math.max(1, order.qty - (Number(order.received_qty) || 0));
      return item ? { order, item, qty: remainingQty } : null;
    })
    .filter(Boolean), [items, orders]);
  const [rows, setRows] = useState(initialRows);
  const [note, setNote] = useState("");

  const totalOrdered = rows.reduce((sum, row) => sum + row.order.qty, 0);
  const totalReceived = rows.reduce((sum, row) => sum + row.qty, 0);
  const hasChangedQty = rows.some(row => row.qty !== Math.max(1, row.order.qty - (Number(row.order.received_qty) || 0)));
  const displayRows = [...rows].sort((a, b) => {
    const aRemaining = Math.max(1, a.order.qty - (Number(a.order.received_qty) || 0));
    const bRemaining = Math.max(1, b.order.qty - (Number(b.order.received_qty) || 0));
    return Number(b.qty !== bRemaining) - Number(a.qty !== aRemaining);
  });

  const updateQty = (orderId, nextQty) => {
    setRows(prev => prev.map(row => row.order.id === orderId
      ? { ...row, qty: Math.max(1, nextQty) }
      : row
    ));
  };

  const fillRemainingQty = () => {
    setRows(prev => prev.map(row => ({
      ...row,
      qty: Math.max(1, row.order.qty - (Number(row.order.received_qty) || 0)),
    })));
  };

  if (!rows.length) return null;

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.grey900 }}>묶음 입고 수량 확인</h2>
          <p style={{ margin: "5px 0 0", fontSize: 15, color: T.grey500 }}>
            배송된 품목별 실제 수량을 확인해주세요
          </p>
        </div>
        <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 6 }}>
          <X size={24} color={T.grey500} />
        </button>
      </div>

      <div style={{ background: T.blue50, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <PackageCheck size={20} color={T.blue500} />
        <p style={{ margin: 0, fontSize: 15, color: T.grey700, lineHeight: 1.45 }}>
          <strong style={{ color: T.grey900 }}>{rows.length}건</strong> 배송 · 발주 {totalOrdered}개 · 확인 {totalReceived}개
        </p>
      </div>

      <button
        type="button"
        onClick={fillRemainingQty}
        style={{ width: "100%", minHeight: 42, marginBottom: 12, borderRadius: 9999, border: `1.5px solid ${T.grey200}`, background: T.white, color: T.grey700, fontFamily: font, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
      >
        전체 남은 수량 그대로 확인
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "44vh", overflowY: "auto", paddingBottom: 2 }}>
        {displayRows.map(row => {
          const alreadyReceived = Number(row.order.received_qty) || 0;
          const remainingQty = Math.max(1, row.order.qty - alreadyReceived);
          const isDifferent = row.qty !== remainingQty;
          return (
            <div key={row.order.id} style={{ border: `1px solid ${isDifferent ? `${T.orange500}55` : T.grey200}`, borderRadius: 12, padding: 14, background: T.white }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 9999, background: isDifferent ? T.orange500 : T.blue500, marginTop: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900, lineHeight: 1.35, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                    {row.item.name}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: T.grey500 }}>
                    발주 {row.order.qty}{row.item.unit}
                    {alreadyReceived > 0 && ` · 기존 입고 ${alreadyReceived}${row.item.unit}`}
                    {` · 현재 재고 ${row.item.current_qty}${row.item.unit}`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => updateQty(row.order.id, row.qty - 1)} style={{ width: 42, height: 42, borderRadius: 9999, border: `1.5px solid ${T.grey200}`, background: T.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Minus size={18} color={T.grey700} />
                </button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>
                    {row.qty}
                    <span style={{ marginLeft: 2, fontSize: 15, fontFamily: font, fontWeight: 600, color: T.grey500 }}>{row.item.unit}</span>
                  </p>
                  {isDifferent && <p style={{ margin: "2px 0 0", fontSize: 12, color: T.orange500, fontWeight: 700 }}>남은 수량과 다릅니다</p>}
                </div>
                <button type="button" onClick={() => updateQty(row.order.id, row.qty + 1)} style={{ width: 42, height: 42, borderRadius: 9999, border: "none", background: T.blue500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={18} color={T.white} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ margin: "16px 0 8px", fontSize: 15, fontWeight: 700, color: T.grey700 }}>특이사항 (선택)</p>
      <Inp value={note} onChange={event => setNote(event.target.value)} placeholder="예: 일부 박스 파손, 누락 품목 확인 필요" style={{ marginBottom: 12 }} />

      {hasChangedQty && (
        <div style={{ background: T.orange50, borderRadius: 10, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} color={T.orange500} />
          <p style={{ margin: 0, fontSize: 14, color: T.grey700 }}>발주 수량과 다른 품목이 있어요. 확인한 수량으로 재고가 반영됩니다.</p>
        </div>
      )}

      <button type="button" onClick={() => onConfirm(rows.map(row => ({ orderId: row.order.id, actualQty: row.qty })), note)} style={{ width: "100%", padding: "16px 0", borderRadius: 9999, border: "none", background: T.blue500, color: T.white, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: font }}>
        {rows.length}건 입고 수량 확인 완료
      </button>
    </div>
  );
}
