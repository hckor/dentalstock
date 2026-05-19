import { T, font } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";

export function BottomNav({ tab, setTab, items }) {
  const { tokens: dynamicT } = useTheme();

  return (
    <div style={{background:dynamicT.white, borderTop:`1px solid ${dynamicT.grey100}`, display:"flex", paddingTop:6, paddingBottom:"max(18px, env(safe-area-inset-bottom))"}}>
      {items.map(({id, Icon, label, badge}) => {
        const active = tab === id;
        return (
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", padding:"6px 0", position:"relative"}}>
            <Icon size={22} color={active?T.blue500:dynamicT.grey400} strokeWidth={active?2.5:1.8}/>
            <span style={{fontSize:10, fontFamily:font, color:active?T.blue500:dynamicT.grey400, fontWeight:active?700:400}}>{label}</span>
            {badge > 0 && (
              <span style={{position:"absolute", top:2, left:"50%", marginLeft:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:9, fontWeight:700, width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {badge}
              </span>
            )}
            {active && <div style={{position:"absolute", bottom:0, width:20, height:2, background:T.blue500, borderRadius:9999}}/>}
          </button>
        );
      })}
    </div>
  );
}
