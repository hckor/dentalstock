import { T } from "./colors";

export const ST = {
  ok:      { bg:T.successBg, text:T.success, border:T.successLine, label:"정상" },
  warning: { bg:T.warningBg, text:T.warning, border:T.warningLine, label:"부족" },
  danger:  { bg:T.dangerBg,  text:T.danger,  border:T.dangerLine,  label:"소진" },
};
