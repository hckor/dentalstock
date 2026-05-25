import { Activity, CheckCircle2 } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { SecTitle } from "../../shared/SecTitle";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { pagePad, twoLine } from "./homeStyles";

export function ActionQueue({ title = "바로 처리", actions, summary, emptyText = "지금 바로 처리할 항목이 없어요" }) {
  const SummaryIcon = summary?.Icon || CheckCircle2;
  const primaryActionIndex = actions.findIndex(action => action.urgent);
  const primaryIndex = primaryActionIndex >= 0 ? primaryActionIndex : 0;

  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      <Card style={{ overflow: "hidden", padding: 0 }}>
        {summary && (
          <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, background: T.white }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: T.grey50, color: summary.color || T.grey700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SummaryIcon size={19} color="currentColor" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, ...twoLine }}>{summary.title}</span>
              {summary.sub && <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "19px", color: T.grey600, ...twoLine }}>{summary.sub}</span>}
            </span>
            {summary.badge && (
              <span style={{ flexShrink: 0, border: `1px solid ${T.grey200}`, borderRadius: 9999, padding: "7px 9px", background: T.grey50, color: summary.color || T.grey700, fontSize: 12, lineHeight: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
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
          const isPrimary = index === primaryIndex && action.urgent;
          const valueColor = action.urgent ? action.color || T.grey900 : T.grey600;
          const iconColor = action.urgent ? action.color || T.primary : T.grey500;
          return (
            <div key={action.key || action.title}>
              <button
                type="button"
                onClick={action.onClick}
                style={{
                  width: "100%",
                  border: "none",
                  background: T.white,
                  padding: "15px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  fontFamily: font,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 42, height: 42, borderRadius: 14, background: T.grey50, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color="currentColor" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                    <span style={{ display: "block", minWidth: 0, margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{action.title}</span>
                    {action.value && (
                      <span style={{ flexShrink: 0, fontSize: 14, lineHeight: "20px", fontWeight: 900, color: valueColor }}>
                        {action.value}
                      </span>
                    )}
                  </span>
                  {action.sub && <span style={{ display: "block", marginTop: 2, fontSize: 14, lineHeight: "20px", color: T.grey500, ...twoLine }}>{action.sub}</span>}
                </span>
                <span style={{ flexShrink: 0, minWidth: 64, boxSizing: "border-box", border: isPrimary ? "none" : `1px solid ${T.grey200}`, padding: "8px 11px", borderRadius: 9999, background: isPrimary ? T.primary : T.white, color: isPrimary ? T.white : T.grey700, fontSize: 13, lineHeight: "18px", fontWeight: 800, textAlign: "center", whiteSpace: "nowrap" }}>
                  {action.actionLabel}
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
