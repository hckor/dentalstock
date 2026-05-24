import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import { T, monoFont } from "../../../constants/colors";
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
	          style={{fontSize: 16, color:T.primary, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600}}>
          전체보기
        </button>
      </div>
      <Card>
        {recent.length === 0 ? (
          <p style={{margin:0, padding:"24px 16px", fontSize: 16, color:T.grey400, textAlign:"center"}}>입출고 이력이 없어요</p>
        ) : recent.map((tx, i) => {
          const item = items.find(it => it.id === tx.item_id);
          return (
            <div key={tx.id}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px"}}>
	                <div style={{width:44, height:44, borderRadius:9999, background:tx.type==="in"?T.primaryBg:tx.type==="out"?T.dangerBg:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
	                  {tx.type==="in"
	                    ? <ArrowDownToLine size={18} color={T.primary}/>
	                    : tx.type==="out"
	                      ? <ArrowUpFromLine size={18} color={T.danger}/>
                      : <SlidersHorizontal size={18} color={T.grey600}/>}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                  <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey500}}>{tx.user} · {fmtDate(tx.created_at)}</p>
                </div>
	                <span style={{fontSize: 16, fontWeight:700, color:tx.type==="in"?T.primary:tx.type==="out"?T.danger:T.grey700, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>
                  {tx.type==="adjust" && tx.before_qty !== undefined && tx.after_qty !== undefined
                    ? `${tx.before_qty}→${tx.after_qty}`
                    : tx.type==="adjust"
                      ? `보정 ${tx.qty}`
                      : `${tx.type==="in"?"+":"-"}${tx.qty}`}
                </span>
              </div>
              {i < recent.length - 1 && <Divider/>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
