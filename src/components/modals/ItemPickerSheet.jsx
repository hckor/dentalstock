import { X, ChevronRight } from "lucide-react";
import { T, font } from "../../constants/colors";
import { catColor } from "../../utils/helpers";
import { Divider } from "../shared/Divider";

export function ItemPickerSheet({items, setSelItem, onClose}) {
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:26, fontWeight:700, color:T.grey900}}>품목 선택</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={24} color={T.grey500}/></button>
      </div>
      {items.map((item,i) => (
        <div key={item.id}>
          <button onClick={()=>setSelItem(item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"18px 0", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
            <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:20, fontWeight:600, color:T.grey900}}>{item.name}</p>
              <p style={{margin:0, fontSize:18, color:T.grey500}}>{item.current_qty}{item.unit}</p>
            </div>
            <ChevronRight size={20} color={T.grey400}/>
          </button>
          {i<items.length-1&&<Divider/>}
        </div>
      ))}
    </div>
  );
}
