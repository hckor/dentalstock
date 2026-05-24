import { Activity, CheckCircle2 } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { SecTitle } from "../../shared/SecTitle";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { pagePad, twoLine } from "./homeStyles";

export function ActionQueue({ title = "바로 처리", actions, summary, emptyText = "지금 바로 처리할 항목이 없어요", quiet = false }) {
  const SummaryIcon = summary?.Icon || CheckCircle2;
  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      <Card style={{ overflow: "hidden", padding: 0 }}>
        {summary && (
          <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, background: quiet ? T.white : summary.bg || T.grey50 }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: quiet ? T.grey50 : T.white, color: summary.color || T.green500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SummaryIcon size={19} color="currentColor" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, ...twoLine }}>{summary.title}</span>
              <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "19px", color: T.grey600, ...twoLine }}>{summary.sub}</span>
            </span>
            {summary.badge && (
              <span style={{ flexShrink: 0, border: quiet ? `1px solid ${T.grey200}` : "none", borderRadius: 9999, padding: "7px 9px", background: quiet ? T.grey50 : T.white, color: summary.color || T.green500, fontSize: 12, lineHeight: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
                {summary.badge}
              </span>
            )}
          </div>
        )}
        {summary && actions.length > 0 && <Divider />}
        {actions.length === 0 ? (
          <p style={{ margin: 0, padding: "24px 16px", fontSize: 15, color: T.grey500, textAlign: "center" }}>{emptyText}</p>
        ) : actions.map((action, index) => {
          const Icon = action.Icon || Activity;
          return (
            <div key={action.key || action.title}>
              <button
                type="button"
                onClick={action.onClick}
                style={{
                  width: "100%",
                  border: "none",
                  background: quiet ? T.white : action.urgent ? action.bg || T.orange50 : T.white,
                  padding: "15px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  fontFamily: font,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 42, height: 42, borderRadius: 14, background: quiet ? T.grey50 : action.iconBg || T.blue50, color: action.color || T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color="currentColor" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, ...twoLine }}>{action.title}</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 14, lineHeight: "20px", color: T.grey500, ...twoLine }}>{action.sub}</span>
                </span>
                <span style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
                  {action.value && <span style={{ fontSize: 16, fontWeight: 800, color: action.color || T.grey900, fontFamily: monoFont }}>{action.value}</span>}
                  <span style={{ minWidth: 82, boxSizing: "border-box", border: "none", padding: "9px 12px", borderRadius: 9999, background: action.color || T.blue500, color: T.white, fontSize: 13, lineHeight: "18px", fontWeight: 800, textAlign: "center", whiteSpace: "nowrap" }}>
                    {action.actionLabel}
                  </span>
                </span>
              </button>
              {index < actions.length - 1 && <Divider />}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
