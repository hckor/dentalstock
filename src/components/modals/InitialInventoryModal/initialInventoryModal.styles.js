import { T, font } from "../../../constants/colors";

export const segmentStyle = {
  flex: 1,
  height: 42,
  border: "none",
  borderRadius: 12,
  fontFamily: font,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export const filterChipStyle = (active) => ({
  flexShrink: 0,
  height: 36,
  padding: "0 14px",
  borderRadius: 9999,
  border: `1px solid ${active ? T.blue500 : T.grey200}`,
  background: active ? T.blue500 : T.white,
  color: active ? T.white : T.grey700,
  fontFamily: font,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});
