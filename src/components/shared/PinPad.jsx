import { Delete } from "lucide-react";
import { T, font } from "../../constants/colors";

export function PinPad({onChange, onDelete}) {
  const keys=["1","2","3","4","5","6","7","8","9","","0","del"];
  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
      {keys.map((k,i) => k===""?<div key={i}/> : (
        <button key={i} onClick={()=>k==="del"?onDelete():onChange(k)}
          style={{padding:"18px 0", borderRadius:14, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", fontFamily:font, fontSize:k==="del"?18:24, fontWeight:600, color:T.grey900, display:"flex", alignItems:"center", justifyContent:"center"}}>
          {k==="del"?<Delete size={24} color={T.grey600}/>:k}
        </button>
      ))}
    </div>
  );
}
