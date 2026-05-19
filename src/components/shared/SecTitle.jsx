import { memo } from "react";
import { T } from "../../constants/colors";

export const SecTitle = memo(function SecTitle({children}) {
  return (
    <p style={{margin:"0 0 10px", fontSize:16, fontWeight:600, color:T.grey800}}>{children}</p>
  );
});
