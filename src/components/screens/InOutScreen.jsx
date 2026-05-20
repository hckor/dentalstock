import { useState, useMemo } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { T, font, CS, monoFont } from "../../constants/colors";
import { dateKey, todayKey } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

function groupByDate(txs) {
  const map = {};
  txs.forEach(tx => {
    const d = tx.created_at.slice(0,10);
    if (!map[d]) map[d] = [];
    map[d].push(tx);
  });
  return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
}

function formatDateHeader(dateStr) {
  const today = todayKey();
  const yesterday = dateKey(new Date(Date.now()-86400000));
  if (dateStr === today) return `오늘 · ${dateStr.slice(5).replace("-",".")}`;
  if (dateStr === yesterday) return `어제 · ${dateStr.slice(5).replace("-",".")}`;
  return dateStr.slice(5).replace("-",".");
}

function formatTime(created_at) {
  const d = new Date(created_at);
  const h = String(d.getHours()).padStart(2,"0");
  const m = String(d.getMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}

export function InOutScreen({items, txs, openModal}) {
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    if (typeFilter === "all") return txs;
    return txs.filter(tx => tx.type === typeFilter);
  }, [txs, typeFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const todayTxs = txs.filter(tx => tx.created_at.slice(0,10) === todayKey());
  const todayIn  = todayTxs.filter(tx=>tx.type==="in").reduce((s,tx)=>s+tx.qty,0);
  const todayOut = todayTxs.filter(tx=>tx.type==="out").reduce((s,tx)=>s+tx.qty,0);

  return (
    <div style={{paddingBottom:160}}>
      {/* 오늘 요약 카드 */}
      {todayTxs.length > 0 && (
        <div style={{padding:"12px 16px 0"}}>
          <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"16px 20px", display:"flex", alignItems:"center", gap:0}}>
            <div style={{flex:1, textAlign:"center", borderRight:`1px solid ${T.grey200}`}}>
              <p style={{margin:0, fontSize: 13, lineHeight:"20px", color:T.grey500, marginBottom:2}}>입고</p>
              <p style={{margin:0, fontSize: 30, lineHeight:"36px", fontWeight:700, color:T.blue500, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>+{todayIn}</p>
            </div>
            <div style={{flex:1, textAlign:"center", borderRight:`1px solid ${T.grey200}`}}>
              <p style={{margin:0, fontSize: 13, lineHeight:"20px", color:T.grey500, marginBottom:2}}>출고</p>
              <p style={{margin:0, fontSize: 30, lineHeight:"36px", fontWeight:700, color:T.red500, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>-{todayOut}</p>
            </div>
            <div style={{flex:1, textAlign:"center"}}>
              <p style={{margin:0, fontSize: 13, lineHeight:"20px", color:T.grey500, marginBottom:2}}>순증감</p>
              <p style={{margin:0, fontSize: 30, lineHeight:"36px", fontWeight:700, color:todayIn-todayOut>=0?T.blue500:T.red500, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{todayIn-todayOut>=0?"+":""}{todayIn-todayOut}</p>
            </div>
          </div>
        </div>
      )}

      {/* 필터 탭 */}
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex", background:T.grey100, borderRadius:12, padding:4, gap:2}}>
          {[{id:"all",label:"전체"},{id:"in",label:"입고"},{id:"out",label:"출고"}].map(f=>(
            <button key={f.id} onClick={()=>setTypeFilter(f.id)} style={{flex:1, padding:"12px 0", border:"none", borderRadius:8, background:typeFilter===f.id?T.white:"transparent", boxShadow:typeFilter===f.id?"0px 2px 4px rgba(0,0,0,0.06)":"none", cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:600, color:typeFilter===f.id?T.grey900:T.grey500, transition:"all 120ms"}}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜별 이력 */}
      <div style={{padding:"12px 16px 24px"}}>
        {grouped.length === 0 ? (
          <div style={{textAlign:"center", padding:"40px 0"}}>
            <p style={{margin:0, fontSize: 16, color:T.grey400}}>입출고 이력이 없어요</p>
          </div>
        ) : grouped.map(([date, dayTxs]) => {
          return (
            <div key={date} style={{marginBottom:20}}>
              {/* 날짜 헤더 */}
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey700}}>{formatDateHeader(date)}</p>
              </div>
              <Card>
                {dayTxs.map((tx,i)=>{
                  const item = items.find(it=>it.id===tx.item_id);
                  return (
                    <div key={tx.id}>
                      <div style={{display:"flex", alignItems:"flex-start", gap:12, padding:"18px 20px"}}>
                        <div style={{width:44, height:44, borderRadius:9999, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                          {tx.type==="in"?<ArrowDownToLine size={18} color={T.blue500}/>:<ArrowUpFromLine size={18} color={T.red500}/>}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <p style={{margin:0, fontSize: 16, lineHeight:"22px", fontWeight:600, color:T.grey900, ...twoLineText}}>{item?.name}</p>
                          <p style={{margin:"1px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
                            {tx.note||""}
                            {tx.note ? " · " : ""}{tx.user}
                          </p>
                        </div>
                        <div style={{textAlign:"right", flexShrink:0, minWidth:54}}>
                          <p style={{margin:0, fontSize: 16, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</p>
                          <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey400}}>{formatTime(tx.created_at)}</p>
                        </div>
                      </div>
                      {i < dayTxs.length-1 && <Divider/>}
                    </div>
                  );
                })}
              </Card>
            </div>
          );
        })}
      </div>

      <div style={{position:"absolute",left:16,right:16,bottom:108,zIndex:20,background:T.white,border:`1px solid ${T.grey200}`,borderRadius:24,padding:8,display:"flex",gap:8,boxShadow:"0px 8px 24px rgba(0,0,0,0.16)"}}>
        <button onClick={()=>openModal("in")} style={{flex:1,minHeight:52,padding:"14px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6,whiteSpace:"nowrap"}}>
          <ArrowDownToLine size={18} style={{flexShrink:0}}/> 입고 등록
        </button>
        <button onClick={()=>openModal("out")} style={{flex:1,minHeight:52,padding:"14px 0",borderRadius:9999,border:"none",background:T.grey100,color:T.red500,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6,whiteSpace:"nowrap"}}>
          <ArrowUpFromLine size={18} style={{flexShrink:0}}/> 출고 등록
        </button>
      </div>
    </div>
  );
}
