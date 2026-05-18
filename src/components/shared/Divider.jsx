import { memo } from "react";
import { T } from "../../constants/colors";

export const Divider = memo(function Divider() {
  return <div style={{height:1, background:T.grey100, margin:"0 16px"}}/>;
});
