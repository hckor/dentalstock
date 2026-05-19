import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { T } from "../../../constants/colors";
import { fmtDate } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { SecTitle } from "../../shared/SecTitle";

export function RecentTxList({ txs, items, setTab }) {
  const recent = txs.slice(0, 5);

  return (
    <div style={{padding:"16px 16px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <SecTitle>최근 입출고</SecTitle>
        <button onClick={()=>setTab("inout")}
          style={{fontSize:14, color:T.blue500, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600}}>
          전체보기
        </button>
      </div>
      <Card>
        {recent.length === 0 ? (
          <p style={{margin:0, padding:"24px 16px", fontSize:16, color:T.grey400, textAlign:"center"}}>입출고 이력이 없어요</p>
        ) : recent.map((tx, i) => {
          const item = items.find(it => it.id === tx.item_id);
          return (
            <div key={tx.id}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"16px 16px"}}>
                <div style={{width:40, height:40, borderRadius:9999, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  {tx.type==="in" ? <ArrowDownToLine size={18} color={T.blue500}/> : <ArrowUpFromLine size={18} color={T.red500}/>}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize:16, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                  <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>{tx.user} · {fmtDate(tx.created_at)}</p>
                </div>
                <span style={{fontSize:16, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</span>
              </div>
              {i < recent.length - 1 && <Divider/>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
