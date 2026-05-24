import { T, font } from "../../../constants/colors";

export function MetricTile({ label, value, detail, icon: Icon, tone = "blue" }) {
  const toneStyle = {
    blue: { bg: T.blue50, color: T.blue500 },
    grey: { bg: T.grey100, color: T.grey600 },
    red: { bg: T.red50, color: T.red500 },
    green: { bg: T.green50, color: T.green500 },
  }[tone] || { bg: T.grey100, color: T.grey600 };

  return (
    <div style={{ padding: "13px 14px", borderRadius: 14, background: toneStyle.bg, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
        {Icon && <Icon size={15} color={toneStyle.color} />}
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: toneStyle.color }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.grey900, lineHeight: 1.15 }}>{value}</p>
      {detail && <p style={{ margin: "4px 0 0", fontSize: 12, color: T.grey500, lineHeight: 1.35 }}>{detail}</p>}
    </div>
  );
}

export function TogglePill({ active, label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        minWidth: 84,
        padding: "10px 14px",
        borderRadius: 9999,
        border: `1px solid ${active ? T.blue500 : T.grey200}`,
        background: active ? T.blue50 : T.white,
        color: active ? T.blue500 : T.grey700,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: font,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
}
