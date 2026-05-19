import { useMemo, useState } from "react";
import { X, ChevronRight, Search } from "lucide-react";
import { T, font } from "../../constants/colors";
import { catColor } from "../../utils/helpers";
import { Divider } from "../shared/Divider";

export function ItemPickerSheet({items, setSelItem, onClose}) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(
    () => items.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase())),
    [items, query]
  );

  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>품목 선택</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={24} color={T.grey500}/></button>
      </div>
      <div style={{position:"relative", marginBottom:12}}>
        <Search size={18} color={T.grey400} style={{position:"absolute", left:13, top:"50%", transform:"translateY(-50%)"}}/>
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="품목명 검색"
          style={{width:"100%", boxSizing:"border-box", padding:"12px 14px 12px 40px", borderRadius:10, border:`1px solid ${T.grey200}`, background:T.grey50, color:T.grey800, fontSize:16, fontFamily:font, outline:"none"}}
        />
      </div>
      {filteredItems.map((item,i) => (
        <div key={item.id}>
          <button onClick={()=>setSelItem(item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"18px 0", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
            <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{item.name}</p>
              <p style={{margin:0, fontSize: 16, color:T.grey500}}>{item.current_qty}{item.unit}</p>
            </div>
            <ChevronRight size={20} color={T.grey400}/>
          </button>
          {i<filteredItems.length-1&&<Divider/>}
        </div>
      ))}
      {filteredItems.length === 0 && (
        <p style={{margin:0, padding:"28px 0 12px", textAlign:"center", fontSize:16, color:T.grey400}}>검색 결과가 없어요</p>
      )}
    </div>
  );
}
