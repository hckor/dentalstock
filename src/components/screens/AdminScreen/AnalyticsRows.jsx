import { AlertTriangle, ClipboardList, Coins, Store, TrendingUp } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { pct } from "../../../utils/helpers";
import { formatMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { PERIODS } from "./analyticsTabUtils";

export function PeriodSelector({ period, setPeriod }) {
  return (
    <div style={{ display: "flex", background: T.grey100, borderRadius: 12, padding: 3, marginBottom: 16 }}>
      {PERIODS.map(option => {
        const active = option.id === period;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 9, border: "none", background: active ? T.white : "transparent", boxShadow: active ? T.shadowControl : "none", cursor: "pointer", fontFamily: font, fontSize: 16, fontWeight: active ? 700 : 500, color: active ? T.grey900 : T.grey500, transition: "all 120ms" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DataRows({ rows, emptyText, renderRow }) {
  if (!rows.length) {
    return (
      <Card>
        <p style={{ margin: 0, padding: "24px 16px", fontSize: 15, color: T.grey500, textAlign: "center" }}>{emptyText}</p>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 16, overflow: "hidden" }}>
      {rows.map((row, index) => (
        <div key={row.key || row.id || row.item?.id || row.name}>
          {renderRow(row, index)}
          {index < rows.length - 1 && <Divider />}
        </div>
      ))}
    </Card>
  );
}

export function TopCauseRows({ rows }) {
  if (!rows.length) {
    return (
      <Card style={{ marginBottom: 16, padding: "22px 16px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", color: T.grey500, wordBreak: "keep-all" }}>
          이번 달에는 비용을 크게 흔드는 원인이 아직 없어요.
        </p>
      </Card>
    );
  }

  const iconByType = {
    order: ClipboardList,
    usage: TrendingUp,
    waste: AlertTriangle,
    category: Coins,
  };
  const colorByType = {
    order: T.orange500,
    usage: T.blue500,
    waste: T.red500,
    category: T.green500,
  };
  const bgByType = {
    order: T.orange50,
    usage: T.blue50,
    waste: T.red50,
    category: T.green50,
  };

  return (
    <Card style={{ marginBottom: 16, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = iconByType[row.type] || TrendingUp;
        const color = colorByType[row.type] || T.grey700;
        const bg = bgByType[row.type] || T.grey100;
        return (
          <div key={row.key}>
            <div style={{ padding: "15px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9999, background: T.grey900, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: monoFont, fontSize: 13, fontWeight: 800 }}>
                {index + 1}
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={19} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.title}</p>
                  <p style={{ margin: 0, flexShrink: 0, fontSize: 15, lineHeight: "20px", fontWeight: 800, color, fontFamily: monoFont }}>{formatMoney(row.amount)}</p>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>이유: {row.reason}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey500, wordBreak: "keep-all" }}>다음: {row.nextAction}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

export function CategoryCostRows({ rows, maxAmount, emptyText = "카테고리별 비용 데이터가 없어요." }) {
  if (!rows.length) {
    return (
      <Card>
        <p style={{ margin: 0, padding: "24px 16px", fontSize: 15, color: T.grey500, textAlign: "center" }}>{emptyText}</p>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 16, padding: 16 }}>
      {rows.map((category, index) => {
        const deltaColor = category.deltaAmount > 0 ? T.warning : category.deltaAmount < 0 ? T.success : T.grey500;
        const deltaText = category.deltaAmount > 0
          ? `+${formatMoney(category.deltaAmount)}`
          : category.deltaAmount < 0
            ? `-${formatMoney(Math.abs(category.deltaAmount))}`
            : "변화 없음";
        return (
          <div key={category.id} style={{ marginTop: index === 0 ? 0 : 15 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 9999, background: category.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ display:"block", fontSize: 15, lineHeight:"20px", fontWeight: 800, color: T.grey800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category.name}</span>
                  <span style={{ display:"block", marginTop:2, fontSize: 12, lineHeight:"17px", fontWeight: 700, color: deltaColor }}>
                    이전 기간 대비 {deltaText}
                  </span>
                </div>
              </div>
              <span style={{ flexShrink:0, fontSize: 15, lineHeight:"20px", fontWeight: 800, color: T.grey900, fontFamily: monoFont }}>{formatMoney(category.amount)}</span>
            </div>
            <div style={{ height: 7, borderRadius: 9999, background: T.grey100, overflow: "hidden" }}>
              <div style={{ width: `${pct(category.amount, maxAmount)}%`, height: "100%", borderRadius: 9999, background: category.color }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

export function CostDriverRow({ row }) {
  return (
    <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: T.orange50, color: T.orange500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <TrendingUp size={19} color="currentColor" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>이전 {row.previousQty}{row.item.unit} → 현재 {row.qty}{row.item.unit}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.orange500, fontFamily: monoFont }}>{formatMoney(row.deltaAmount)}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: T.grey500 }}>증가</p>
      </div>
    </div>
  );
}

export function WasteRiskRow({ row }) {
  return (
    <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: T.red50, color: T.red500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertTriangle size={19} color="currentColor" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item.name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>{row.reason} · 위험 {row.riskQty}{row.item.unit}</p>
      </div>
      <p style={{ margin: 0, flexShrink: 0, fontSize: 15, fontWeight: 800, color: T.red500, fontFamily: monoFont }}>{formatMoney(row.riskAmount)}</p>
    </div>
  );
}

export function VendorPurchaseRow({ row, maxAmount }) {
  return (
    <div style={{ padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Store size={19} color="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>{row.count}건 승인/입고</p>
        </div>
        <p style={{ margin: 0, flexShrink: 0, fontSize: 15, fontWeight: 800, color: T.grey900, fontFamily: monoFont }}>{formatMoney(row.amount)}</p>
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: T.grey100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct(row.amount, maxAmount)}%`, borderRadius: 9999, background: T.blue500 }} />
      </div>
    </div>
  );
}
