import { memo } from "react";

export const Chip = memo(function Chip({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 9999,
        background: bg,
        color,
        lineHeight: "18px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
});
