import { T } from "../../constants/colors";
import { CS } from "../../constants/colors";

export const Card = ({children, style={}}) => (
  <div style={{background:T.white, borderRadius:12, border:"none", boxShadow:CS, ...style}}>
    {children}
  </div>
);
