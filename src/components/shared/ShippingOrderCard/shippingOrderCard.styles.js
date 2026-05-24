import { T, font, monoFont } from "../../../constants/colors";

export const bodyStyle = { padding: "18px 20px" };
export const headerStyle = { display: "flex", alignItems: "flex-start", gap: 12 };
export const titleStyle = { margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 };
export const metaStyle = { margin: "4px 0 0", fontSize: 16, color: T.grey500 };
export const emphasisStyle = { fontWeight: 600, color: T.grey700 };
export const contentStyle = { flex: 1, minWidth: 0 };
export const iconStyle = { flexShrink: 0 };
export const actionRowStyle = { display: "flex", alignItems: "stretch", gap: 8 };
export const noticeStyle = { padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 };
export const stackedActionStyle = { display: "flex", flexDirection: "column", gap: 8 };
export const trackingNumberStyle = { margin: "6px 0 0", fontSize: 16, color: T.grey600, fontFamily: "monospace", fontWeight: 500 };
export const actionButtonBase = {
  flex: 1,
  minWidth: 0,
  padding: "12px 12px",
  borderRadius: 9999,
  cursor: "pointer",
  fontFamily: font,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  whiteSpace: "nowrap",
  wordBreak: "keep-all",
};

export const actionButtonVariants = {
  primary: { border: "none", background: T.blue500, color: T.white },
  dangerOutline: { border: `1.5px solid ${T.red500}55`, background: T.white, color: T.red500 },
  neutralOutline: { border: `1.5px solid ${T.grey300}`, background: T.white, color: T.grey700 },
};

export const pricePanelStyle = { margin: "2px 0 14px", borderRadius: 14, background: T.grey50, padding: "12px 14px" };
export const pricePanelHeaderStyle = { display: "flex", alignItems: "center", gap: 10 };
export const pricePanelTitleStyle = { margin: 0, fontSize: 14, fontWeight: 700, color: T.grey900 };
export const pricePanelSubtitleStyle = { margin: "3px 0 0", fontSize: 13, color: T.grey500 };
export const priceCandidateListStyle = { display: "flex", flexDirection: "column", gap: 7 };
export const priceCandidateRowBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "9px 10px",
  borderRadius: 12,
};
export const candidateDotBaseStyle = { width: 8, height: 8, borderRadius: 9999, flexShrink: 0 };
export const candidateNameRowStyle = { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" };
export const candidateNameStyle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: T.grey800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};
export const candidateMetaStyle = { margin: "2px 0 0", fontSize: 12, color: T.grey500 };
export const candidatePriceStyle = { margin: 0, flexShrink: 0, fontFamily: monoFont, fontSize: 14, fontWeight: 700 };
export const candidateBadgeBaseStyle = { borderRadius: 9999, padding: "2px 7px", fontSize: 11, fontWeight: 700 };
export const candidateBadgeVariants = {
  best: { background: T.blue50, color: T.blue500 },
  soldOut: { background: T.red50, color: T.red500 },
};
export const emptyCandidateStyle = { margin: "10px 0 0", fontSize: 13, color: T.grey500, lineHeight: 1.45 };
export const selectToggleBaseStyle = {
  width: 26,
  height: 26,
  marginTop: 1,
  borderRadius: 9999,
  color: T.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
export const reviewNoticeBaseStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  padding: "10px 12px",
  borderRadius: 12,
  margin: "0 0 10px",
};
export const reviewNoticeToneStyles = {
  warning: { border: `1px solid ${T.orange500}33`, background: T.orange50, color: T.orange500 },
  danger: { border: `1px solid ${T.red500}33`, background: T.red50, color: T.red500 },
};
export const holdStatusMeta = { bg: T.holdBg, text: T.hold, border: T.holdLine, label: "보류됨", short: "보류" };
export const checklistGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 7 };
export const checklistRowStyle = { borderRadius: 12, border: `1px solid ${T.grey100}`, padding: "9px 10px", background: T.grey50 };
export const checklistLabelStyle = { margin: 0, fontSize: 12, fontWeight: 800, color: T.grey500 };
export const checklistValueStyle = { margin: "4px 0 0", fontSize: 13, fontWeight: 800, lineHeight: 1.3, wordBreak: "keep-all", overflowWrap: "anywhere" };
export const decisionLeadStyle = { padding: "14px", background: T.white, display: "flex", flexDirection: "column", gap: 10 };
export const decisionConclusionStyle = { margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 900, wordBreak: "keep-all" };
export const decisionOneLineStyle = { margin: "4px 0 0", fontSize: 13, lineHeight: 1.45, color: T.grey600, wordBreak: "keep-all", overflowWrap: "anywhere" };
export const nextActionStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  borderRadius: 12,
  padding: "10px 12px",
  background: T.grey50,
  color: T.grey800,
};
export const nextActionLabelStyle = { margin: 0, flexShrink: 0, fontSize: 12, fontWeight: 900, color: T.grey500 };
export const nextActionTextStyle = { margin: 0, minWidth: 0, fontSize: 13, lineHeight: 1.4, fontWeight: 800, color: T.grey900, wordBreak: "keep-all", overflowWrap: "anywhere" };
