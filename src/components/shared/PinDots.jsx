import { T } from "../../constants/colors";

export function PinDots({length, filled, error}) {
  return (
    <div style={{display:"flex", justifyContent:"center", gap:16, margin:"24px 0"}}>
      {Array.from({length}).map((_,i) => (
        <div key={i} style={{width:14, height:14, borderRadius:9999, background:error?T.red500:i<filled?T.grey900:T.grey200, transition:"background 150ms"}}/>
      ))}
    </div>
  );
}
