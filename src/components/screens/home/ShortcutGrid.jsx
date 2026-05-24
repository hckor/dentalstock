import { T, font } from "../../../constants/colors";
import { SecTitle } from "../../shared/SecTitle";
import { pagePad, oneLine } from "./homeStyles";

export function ShortcutGrid({ title = "빠른 실행", actions, quiet = false }) {
  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {actions.map(action => {
          const Icon = action.Icon;
          const quietColor = action.color || (action.primary ? T.primary : T.grey700);
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              style={{
                minHeight: 68,
                border: quiet ? `1px solid ${action.primary ? `${quietColor}55` : T.grey200}` : "none",
                borderRadius: 14,
                background: quiet ? T.white : action.primary ? T.primary : T.white,
                color: quiet ? T.grey800 : action.primary ? T.white : T.grey800,
                boxShadow: T.shadowCard,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                fontFamily: font,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              <Icon size={20} color={quiet ? quietColor : "currentColor"} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, lineHeight: "20px", fontWeight: 800, color: quiet ? T.grey900 : undefined, ...oneLine }}>{action.label}</span>
                {action.sub && <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "17px", color: quiet ? T.grey500 : undefined, opacity: quiet ? 1 : action.primary ? 0.82 : 0.58, fontWeight: 700, ...oneLine }}>{action.sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
