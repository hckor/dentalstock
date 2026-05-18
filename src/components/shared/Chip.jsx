export const Chip = ({label, color, bg}) => (
  <span style={{fontSize:12, fontWeight:700, padding:"3px 7px", borderRadius:12, background:bg, color, border:"none", lineHeight:"18px", whiteSpace:"nowrap"}}>{label}</span>
);
