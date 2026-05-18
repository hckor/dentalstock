import { memo } from "react";
import { T } from "../../constants/colors";
import { CS } from "../../constants/colors";

export const Card = memo(function Card({children, style={}}) {
  return (
    <div style={{background:T.white, borderRadius:12, border:"none", boxShadow:CS, ...style}}>
      {children}
    </div>
  );
});
