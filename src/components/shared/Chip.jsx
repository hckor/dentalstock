import { memo } from "react";

export const Chip = memo(function Chip({label, color, bg}) {
  return (
    <span style={{fontSize:12, fontWeight:700, padding:"3px 7px", borderRadius:12, background:bg, color, border:"none", lineHeight:"18px", whiteSpace:"nowrap"}}>{label}</span>
  );
});
