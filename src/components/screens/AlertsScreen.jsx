import {
  AlertTriangle, Clock, Truck, ShoppingCart, XCircle, PackageCheck,
  CalendarDays, ClipboardCheck
} from "lucide-react";
import { T } from "../../constants/colors";
import { fmtFull } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";

export function AlertsScreen({notifs, setNotifs}) {
  const TM = {
    low_stock:     {bg:T.orange50, color:T.orange500, Icon:AlertTriangle},
    expiry:        {bg:T.red50,    color:T.red500,    Icon:Clock},
    order_req:     {bg:T.orange50, color:T.orange500, Icon:ShoppingCart},
    ordered:       {bg:T.teal50,   color:T.teal500,   Icon:Truck},
    order_rejected:{bg:T.red50,    color:T.red500,    Icon:XCircle},
    received:      {bg:T.green50,  color:T.green500,  Icon:PackageCheck},
    surgery_today: {bg:T.blue50,   color:T.blue500,   Icon:CalendarDays},
    surgery_ready: {bg:T.green50,  color:T.green500,  Icon:ClipboardCheck},
    surgery_reminder:{bg:T.orange50,color:T.orange500,Icon:Clock},
  };
  const unread=notifs.filter(n=>!n.is_read).length;
  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <p style={{margin:0,fontSize:13,color:T.grey500}}>미확인 <span style={{fontWeight:700,color:T.red500}}>{unread}건</span></p>
        <button onClick={()=>setNotifs(p=>p.map(n=>({...n,is_read:true})))} style={{fontSize:13,color:T.blue500,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>모두 읽음</button>
      </div>
      <Card>
        {notifs.map((n,i)=>{const m=TM[n.type]||TM.order_req;return(
          <div key={n.id}>
            <button onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,is_read:true}:x))} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",opacity:n.is_read?0.55:1}}>
              <div style={{width:36,height:36,borderRadius:10,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:m.color}}><m.Icon size={18}/></div>
              <div style={{flex:1,textAlign:"left"}}><p style={{margin:0,fontSize:14,fontWeight:n.is_read?400:600,color:T.grey900,lineHeight:1.5}}>{n.message}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{n.sub}</p><p style={{margin:"4px 0 0",fontSize:11,color:T.grey400}}>{fmtFull(n.created_at)}</p></div>
              {!n.is_read&&<div style={{width:8,height:8,borderRadius:9999,background:T.red500,flexShrink:0,marginTop:4}}/>}
            </button>
            {i<notifs.length-1&&<Divider/>}
          </div>
        );})}
      </Card>
    </div>
  );
}
