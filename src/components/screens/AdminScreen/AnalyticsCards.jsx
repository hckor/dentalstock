import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { T } from "../../../constants/colors";
import { compactMoney, formatMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";

export function InsightCard({ totalCost, previousCost, topDriver, pendingAmount, wasteRiskAmount }) {
  const delta = totalCost - previousCost;
  const isUp = delta > 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;
  const tone = delta === 0 ? T.grey700 : isUp ? T.orange500 : T.green500;
  const headline = delta === 0
    ? "지난 기간과 비용 흐름이 비슷합니다"
    : `지난 기간보다 ${compactMoney(Math.abs(delta))} ${isUp ? "증가" : "감소"}했습니다`;
  const driverText = topDriver
    ? `주 원인은 ${topDriver.item.name} ${compactMoney(topDriver.deltaAmount)} 증가입니다.`
    : "뚜렷한 증가 품목은 아직 없습니다.";

  return (
    <Card style={{ padding: 16, marginBottom: 16, border: `1px solid ${delta === 0 ? T.grey200 : `${tone}55`}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.grey50, color: tone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DeltaIcon size={21} color="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: "24px", fontWeight: 800, color: T.grey900, wordBreak: "keep-all" }}>{headline}</p>
          <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: "21px", color: T.grey600, wordBreak: "keep-all" }}>{driverText}</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey500, wordBreak: "keep-all" }}>
            승인 대기 {formatMoney(pendingAmount)} · 낭비 위험 {formatMoney(wasteRiskAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}
