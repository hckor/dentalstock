import { memo } from "react";

export const Chip = memo(function Chip({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        padding: "3px 7px",
        borderRadius: 12,
        background: bg,
        color,
        lineHeight: "20px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
});
