import { T, font } from "../../constants/colors";

export const Inp = ({value, onChange, placeholder, type="text", style={}}) => (
  <input value={value} onChange={onChange} placeholder={placeholder} type={type}
    style={{width:"100%", height:50, padding:"14px 16px", borderRadius:12, border:`1px solid ${T.inputBorder}`, background:T.inputBg, fontSize:17, lineHeight:"24px", fontWeight:400, color:T.text, fontFamily:font, outline:"none", boxSizing:"border-box", ...style}}/>
);
