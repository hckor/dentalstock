import { ArrowRight, PackageSearch } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { formatMoney as money } from "../../../utils/money";
import { SecTitle } from "../../shared/SecTitle";
import { pagePad, oneLine, countText, signedMoney } from "./homeStyles";

export function OwnerCostStatusCard({ dashboard, setTab }) {
  const delta = dashboard.cost.monthDelta;
  const hasIncrease = delta > 0;
  const hasWasteRisk = dashboard.cost.wasteRiskAmount > 0;
  const pendingAmount = dashboard.orders.pendingAmount;
  const status = hasIncrease || hasWasteRisk || pendingAmount > 0
    ? {
        label: hasIncrease ? "증가 확인" : hasWasteRisk ? "낭비 위험" : "승인 대기",
        color: hasIncrease ? T.orange500 : hasWasteRisk ? T.red500 : T.blue500,
        bg: hasIncrease ? T.orange50 : hasWasteRisk ? T.red50 : T.blue50,
      }
    : {
        label: "안정",
        color: T.green500,
        bg: T.green50,
      };
  const deltaText = delta === 0 ? "전월과 동일" : `전월 대비 ${signedMoney(delta)}`;
  const metrics = [
    { label: "승인 대기", value: money(pendingAmount), color: pendingAmount > 0 ? T.orange500 : T.green500 },
    { label: "낭비 위험", value: money(dashboard.cost.wasteRiskAmount), color: hasWasteRisk ? T.red500 : T.green500 },
    { label: "절감 추정", value: money(dashboard.cost.estimatedSavings), color: dashboard.cost.estimatedSavings > 0 ? T.green500 : T.grey700 },
  ];

  return (
    <div style={pagePad}>
      <SecTitle>비용 상태</SecTitle>
      <button
        type="button"
        onClick={() => setTab("admin:analytics")}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          background: T.white,
          boxShadow: T.shadowCard,
          padding: 16,
          textAlign: "left",
          fontFamily: font,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", fontSize: 13, lineHeight: "18px", fontWeight: 800, color: T.grey500 }}>이번 달 재료비</p>
            <p style={{ margin: 0, fontSize: 30, lineHeight: "36px", fontWeight: 900, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
              {money(dashboard.cost.monthlySpend)}
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 800, color: hasIncrease ? T.orange500 : delta < 0 ? T.green500 : T.grey500 }}>
              {deltaText}
            </p>
          </div>
          <span style={{ flexShrink: 0, borderRadius: 9999, padding: "7px 10px", background: status.bg, color: status.color, fontSize: 13, lineHeight: "18px", fontWeight: 900, whiteSpace: "nowrap" }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "10px 9px" }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey500, ...oneLine }}>{metric.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 900, color: metric.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 12, color: T.blue500, fontSize: 13, lineHeight: "18px", fontWeight: 900 }}>
          비용 상세
          <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}

export function OwnerInventoryShortcutCard({ dashboard, setTab }) {
  const lowCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const expiryCount = dashboard.inventory.expirySoon.length;
  const incomingCount = dashboard.inventory.incoming.length;
  const needsAttention = dashboard.inventory.attentionCount > 0;
  const status = needsAttention
    ? { label: "확인 필요", color: T.orange500, bg: T.orange50 }
    : { label: "안정", color: T.green500, bg: T.green50 };
  const metrics = [
    { label: "부족", value: countText(lowCount, "개"), color: lowCount > 0 ? T.red500 : T.green500 },
    { label: "유통기한", value: countText(expiryCount, "개"), color: expiryCount > 0 ? T.orange500 : T.green500 },
    { label: "입고대기", value: countText(incomingCount, "개"), color: incomingCount > 0 ? T.blue500 : T.green500 },
  ];

  return (
    <div style={pagePad}>
      <SecTitle>재고 현황</SecTitle>
      <button
        type="button"
        onClick={() => setTab("inventory")}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          background: T.white,
          boxShadow: T.shadowCard,
          padding: 15,
          textAlign: "left",
          fontFamily: font,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: status.bg, color: status.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PackageSearch size={20} color="currentColor" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, lineHeight: "22px", fontWeight: 900, color: T.grey900, ...oneLine }}>
              {needsAttention ? `확인 필요 ${dashboard.inventory.attentionCount}개` : "재고 위험 신호 없음"}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "18px", fontWeight: 700, color: T.grey500, ...oneLine }}>
              전체 {dashboard.inventory.total}개 품목
            </span>
          </span>
          <span style={{ flexShrink: 0, borderRadius: 9999, padding: "7px 10px", background: status.bg, color: status.color, fontSize: 13, lineHeight: "18px", fontWeight: 900, whiteSpace: "nowrap" }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "9px 8px" }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey500, ...oneLine }}>{metric.label}</p>
              <p style={{ margin: "3px 0 0", fontSize: 15, lineHeight: "20px", fontWeight: 900, color: metric.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 11, color: T.blue500, fontSize: 13, lineHeight: "18px", fontWeight: 900 }}>
          재고 보기
          <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}
