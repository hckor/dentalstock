import { T, font, monoFont } from "../../../constants/colors";
import { getActiveOrder } from "../../../utils/helpers";
import { Card } from "../../shared/Card";

export function InventoryStaffSummary({ items, attentionCount, orderedOrders, priorityRows, orders, inventoryTone, onItemClick }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "전체 재고", value: items.length, color: T.primary },
          { label: "확인 필요", value: attentionCount, color: inventoryTone.low.color },
          { label: "입고 대기", value: orderedOrders.length, color: inventoryTone.incoming.color },
        ].map(summary => (
          <Card key={summary.label} style={{ padding: "12px 10px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 16, color: T.grey500 }}>{summary.label}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: summary.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>{summary.value}</p>
          </Card>
        ))}
      </div>

      {priorityRows.length > 0 && (
        <Card style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, lineHeight: "20px", fontWeight: 800, color: T.grey900 }}>재고 리스크 우선순위</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>부족, 유통기한, 입고대기를 먼저 봅니다.</p>
            </div>
            <span style={{ flexShrink: 0, borderRadius: 9999, background: inventoryTone.low.bg, color: inventoryTone.low.color, padding: "5px 9px", fontSize: 12, fontWeight: 800 }}>
              {priorityRows.length}건
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorityRows.map(({ item, statusText, low, expirySoon, incoming, overstock }) => {
              const activeOrder = getActiveOrder(orders, item.id);
              const tone = low ? inventoryTone.low.color : expirySoon ? inventoryTone.expiry.color : incoming ? inventoryTone.incoming.color : overstock ? inventoryTone.overstock.color : T.grey600;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item)}
                  style={{ width: "100%", border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, padding: "11px 12px", textAlign: "left", cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 9999, background: tone, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "19px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      현재 {item.current_qty}{item.unit} · 최소 {item.min_qty}{item.unit}{activeOrder ? ` · ${activeOrder.qty}${item.unit} 배송 중` : ""}
                    </p>
                  </div>
                  <span style={{ flexShrink: 0, borderRadius: 9999, background: `${tone}14`, color: tone, padding: "5px 8px", fontSize: 12, fontWeight: 800 }}>
                    {statusText}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
