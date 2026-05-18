import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { T, CS } from "../../constants/colors";
import { fmtDate } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { SecTitle } from "../shared/SecTitle";

export function InOutScreen({items, txs, openModal}) {
  return (
    <div>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[{label:"입고 등록",sub:"재고가 들어왔어요",Icon:ArrowDownToLine,iconBg:T.blue50,iconColor:T.blue500,type:"in"},{label:"출고 등록",sub:"재고를 사용했어요",Icon:ArrowUpFromLine,iconBg:T.red50,iconColor:T.red500,type:"out"}].map(a=>(
            <button key={a.type} onClick={()=>openModal(a.type)} style={{padding:"20px 16px",borderRadius:16,border:`1px solid ${T.grey200}`,background:T.white,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:10,boxShadow:CS}}>
              <div style={{width:48,height:48,borderRadius:9999,background:a.iconBg,display:"flex",alignItems:"center",justifyContent:"center"}}><a.Icon size={24} color={a.iconColor}/></div>
              <div style={{textAlign:"center"}}><p style={{margin:0,fontSize:15,fontWeight:700,color:T.grey900}}>{a.label}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{a.sub}</p></div>
            </button>
          ))}
        </div>
        <SecTitle>입출고 이력</SecTitle>
        <Card style={{marginBottom:24}}>
          {txs.map((tx,i)=>{const item=items.find(it=>it.id===tx.item_id);return(
            <div key={tx.id}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
                <div style={{width:36,height:36,borderRadius:10,background:tx.type==="in"?T.blue50:T.red50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{tx.type==="in"?<ArrowDownToLine size={16} color={T.blue500}/>:<ArrowUpFromLine size={16} color={T.red500}/>}</div>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{tx.note||"-"} · {tx.user}</p></div>
                <div style={{textAlign:"right",flexShrink:0}}><p style={{margin:0,fontSize:15,fontWeight:700,color:tx.type==="in"?T.blue500:T.red500,fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</p><p style={{margin:0,fontSize:11,color:T.grey400}}>{fmtDate(tx.created_at)}</p></div>
              </div>
              {i<txs.length-1&&<Divider/>}
            </div>
          );})}
        </Card>
      </div>
    </div>
  );
}
