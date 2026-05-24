import { toNumber, formatMoney as money } from "../../../utils/money";

export const pagePad = { padding: "16px 16px 0" };
export const oneLine = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
export const twoLine = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

export const countText = (value, unit = "건") => `${Number(value) || 0}${unit}`;
export const signedMoney = (value) => {
  const amount = Math.round(toNumber(value));
  if (amount === 0) return "변동 없음";
  return `${amount > 0 ? "+" : "-"}${money(Math.abs(amount))}`;
};
