import { ROLE_META } from "../../constants/permissions";
import { initials } from "../../utils/helpers";

export const Avatar = ({name, role, size=44}) => {
  const m = ROLE_META[role];
  return (
    <div style={{width:size, height:size, borderRadius:9999, background:m.bg, border:`2px solid ${m.color}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
      <span style={{fontSize:size*.4, fontWeight:700, color:m.color}}>{initials(name)}</span>
    </div>
  );
};
