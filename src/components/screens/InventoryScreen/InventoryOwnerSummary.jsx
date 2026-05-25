import { T, monoFont } from "../../../constants/colors";
import { compactMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";

export function InventoryOwnerSummary({
  attentionCount,
  ownerCostSummary,
  inventoryTone,
}) {
  const summaryRows = [
    { label: "부족", value: compactMoney(ownerCostSummary.shortageAmount), color: ownerCostSummary.shortageAmount > 0 ? inventoryTone.low.color : T.grey700 },
    { label: "만료", value: compactMoney(ownerCostSummary.expiryRiskAmount), color: ownerCostSummary.expiryRiskAmount > 0 ? inventoryTone.expiry.color : T.grey700 },
    { label: "과잉", value: compactMoney(ownerCostSummary.overstockAmount), color: ownerCostSummary.overstockAmount > 0 ? inventoryTone.overstock.color : T.grey700 },
    { label: "입고", value: compactMoney(ownerCostSummary.incomingAmount), color: ownerCostSummary.incomingAmount > 0 ? inventoryTone.incoming.color : T.grey700 },
  ];

  return (
    <Card style={{ padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 900, color: T.grey900 }}>확인할 재고</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>문제 품목을 먼저 보여줍니다.</p>
        </div>
        <span style={{ flexShrink: 0, borderRadius: 9999, background: attentionCount > 0 ? inventoryTone.low.bg : inventoryTone.ok.bg, color: attentionCount > 0 ? inventoryTone.low.color : inventoryTone.ok.color, padding: "6px 9px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
          확인 {attentionCount}건
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {summaryRows.map(summary => (
          <div key={summary.label} style={{ flex:"1 0 72px", minWidth:0, borderRadius: 12, background: T.grey50, padding: "9px 10px" }}>
            <p style={{ margin: 0, fontSize: 11, lineHeight: "15px", fontWeight: 800, color: T.grey500, whiteSpace: "nowrap" }}>{summary.label}</p>
            <p style={{ margin: "3px 0 0", fontSize: 16, lineHeight: "20px", fontWeight: 900, color: summary.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
