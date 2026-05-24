import { T, font, monoFont } from "../../../constants/colors";
import { compactMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { ownerRiskTone, renderOwnerTopReason } from "./inventoryScreenUtils";

export function InventoryOwnerSummary({
  attentionCount,
  ownerCostSummary,
  ownerTopRows,
  inventoryTone,
  onItemClick,
}) {
  return (
    <Card style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 900, color: T.grey900 }}>경영자용 재고 요약</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>재고 수량보다 비용 영향이 큰 항목을 먼저 보여줍니다.</p>
        </div>
        <span style={{ flexShrink: 0, borderRadius: 9999, background: attentionCount > 0 ? inventoryTone.low.bg : inventoryTone.ok.bg, color: attentionCount > 0 ? inventoryTone.low.color : inventoryTone.ok.color, padding: "6px 9px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
          확인 {ownerTopRows.length}건
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: ownerTopRows.length ? 12 : 0 }}>
        {[
          { label: "부족 보충 예상액", value: compactMoney(ownerCostSummary.shortageAmount), color: ownerCostSummary.shortageAmount > 0 ? inventoryTone.low.color : T.grey700 },
          { label: "유통기한 손실 위험액", value: compactMoney(ownerCostSummary.expiryRiskAmount), color: ownerCostSummary.expiryRiskAmount > 0 ? inventoryTone.expiry.color : T.grey700 },
          { label: "과잉재고 묶인 금액", value: compactMoney(ownerCostSummary.overstockAmount), color: ownerCostSummary.overstockAmount > 0 ? inventoryTone.overstock.color : T.grey700 },
          { label: "입고대기 금액", value: compactMoney(ownerCostSummary.incomingAmount), color: ownerCostSummary.incomingAmount > 0 ? inventoryTone.incoming.color : T.grey700 },
        ].map(summary => (
          <div key={summary.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "11px 10px" }}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, lineHeight: "23px", fontWeight: 900, color: summary.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.value}</p>
          </div>
        ))}
      </div>
      {ownerTopRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 900, color: T.grey700 }}>확인 필요 Top 5</p>
          {ownerTopRows.map((row, index) => {
            const tone = ownerRiskTone(row, inventoryTone);
            return (
              <button
                key={row.item.id}
                type="button"
                onClick={() => onItemClick(row.item)}
                style={{ width: "100%", border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, padding: "10px 11px", textAlign: "left", cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 9 }}
              >
                <span style={{ width: 22, height: 22, borderRadius: 9999, background: T.grey100, color: index === 0 ? tone : T.grey700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 900 }}>
                  {index + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", margin: 0, fontSize: 14, lineHeight: "19px", fontWeight: 900, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    현재 {row.item.current_qty}{row.item.unit} · 최소 {row.item.min_qty}{row.item.unit}
                  </span>
                </span>
                <span style={{ flexShrink: 0, maxWidth: "45%", border: `1px solid ${T.grey100}`, borderRadius: 9999, background: T.grey50, color: tone, padding: "5px 8px", fontSize: 12, lineHeight: "16px", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {renderOwnerTopReason(row)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
