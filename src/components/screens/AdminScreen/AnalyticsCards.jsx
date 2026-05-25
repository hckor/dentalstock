import { AlertTriangle, ArrowDownRight, ArrowUpRight, Coins, ClipboardList } from "lucide-react";
import { T, CS, monoFont } from "../../../constants/colors";
import { compactMoney, formatMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";

function StatCard({ label, value, sub, color = T.grey900, Icon, accent = false }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${accent ? `${color}55` : T.grey200}`, borderRadius: 12, padding: "14px 12px", boxShadow: CS, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", color: T.grey500, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
        {Icon && (
          <span style={{ width: 28, height: 28, borderRadius: 10, background: T.grey50, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} color="currentColor" />
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 800, color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>}
    </div>
  );
}

export function AnalyticsSummaryCards({ data }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
      <StatCard label="재료 사용액" value={compactMoney(data.usageCost)} sub={`이전 ${compactMoney(data.previousUsageCost)}`} color={T.grey900} Icon={Coins} />
      <StatCard label="승인 대기액" value={compactMoney(data.pendingAmount)} sub="검토 전 발주" color={data.pendingAmount > 0 ? T.orange500 : T.grey700} Icon={ClipboardList} accent={data.pendingAmount > 0} />
      <StatCard label="낭비 위험" value={compactMoney(data.wasteRiskAmount)} sub="만료/과잉재고" color={data.wasteRiskAmount > 0 ? T.red500 : T.grey700} Icon={AlertTriangle} accent={data.wasteRiskAmount > 0} />
      <StatCard label="절감 추정" value={compactMoney(data.estimatedSavings)} sub="최저가 선택 기준" color={data.estimatedSavings > 0 ? T.green500 : T.grey700} Icon={ArrowDownRight} accent={data.estimatedSavings > 0} />
    </div>
  );
}

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
