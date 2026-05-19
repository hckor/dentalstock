import { T, font } from "../../constants/colors";

export const Inp = ({value, onChange, placeholder, type="text", style={}}) => (
  <input value={value} onChange={onChange} placeholder={placeholder} type={type}
    style={{width:"100%", padding:"16px 16px", borderRadius:12, border:`1px solid rgba(2,32,71,0.05)`, background:"rgba(0,23,51,0.02)", fontSize:18, fontWeight:400, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box", ...style}}/>
);
