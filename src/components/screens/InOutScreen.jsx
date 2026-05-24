import { useState, useMemo } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Clock3, Flame, SlidersHorizontal } from "lucide-react";
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

const DAY_MS = 86400000;

function groupByDate(txs) {
  const map = {};
  txs.forEach(tx => {
    const d = tx.created_at.slice(0,10);
    if (!map[d]) map[d] = [];
    map[d].push(tx);
  });
  return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
}

function getRecentOutCandidates(items, txs) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const today = todayKey();
  const since7 = dateKey(new Date(Date.now() - 6 * DAY_MS));
  const since30 = dateKey(new Date(Date.now() - 29 * DAY_MS));
  const stats = new Map();

  txs.forEach(tx => {
    if (tx.type !== "out") return;
    const item = itemMap.get(tx.item_id);
    if (!item) return;
    const key = tx.created_at.slice(0, 10);
    if (key < since30) return;

    const current = stats.get(tx.item_id) || {
      item,
      todayQty: 0,
      weekQty: 0,
      monthQty: 0,
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      latestAt: tx.created_at,
    };

    const qty = Number(tx.qty) || 0;
    current.monthQty += qty;
    current.monthCount += 1;
    if (key >= since7) {
      current.weekQty += qty;
      current.weekCount += 1;
    }
    if (key === today) {
      current.todayQty += qty;
      current.todayCount += 1;
    }
    if (tx.created_at > current.latestAt) current.latestAt = tx.created_at;
    stats.set(tx.item_id, current);
  });

  return Array.from(stats.values())
    .sort((a, b) =>
      b.todayQty - a.todayQty ||
      b.weekQty - a.weekQty ||
      b.monthQty - a.monthQty ||
      b.weekCount - a.weekCount ||
      b.latestAt.localeCompare(a.latestAt)
    )
    .slice(0, 6);
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
  const quickOutCandidates = useMemo(() => getRecentOutCandidates(items, txs), [items, txs]);

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

      <div style={{padding:"12px 16px 0"}}>
        <Card>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"16px 18px 12px"}}>
            <div style={{minWidth:0}}>
              <p style={{margin:0, fontSize:16, lineHeight:"22px", fontWeight:700, color:T.grey900}}>빠른 출고 후보</p>
              <p style={{margin:"2px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>
                오늘, 최근 7일, 최근 30일 출고가 많은 품목입니다.
              </p>
            </div>
            <div style={{width:38, height:38, borderRadius:9999, background:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Flame size={18} color={T.red500}/>
            </div>
          </div>

          {quickOutCandidates.length > 0 ? (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(156px, 1fr))", gap:8, padding:"0 12px 14px"}}>
              {quickOutCandidates.map(candidate => {
                const { item } = candidate;
                const focusLabel = candidate.todayQty > 0
                  ? `오늘 ${candidate.todayQty}${item.unit}`
                  : candidate.weekQty > 0
                    ? `7일 ${candidate.weekQty}${item.unit}`
                    : `30일 ${candidate.monthQty}${item.unit}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openModal("out", item)}
                    style={{border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"12px 12px", textAlign:"left", cursor:"pointer", fontFamily:font, minWidth:0}}
                  >
                    <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:7}}>
                      <span style={{display:"inline-flex", alignItems:"center", gap:4, padding:"4px 7px", borderRadius:9999, background:candidate.todayQty > 0 ? T.red50 : T.grey100, color:candidate.todayQty > 0 ? T.red500 : T.grey600, fontSize:12, lineHeight:"16px", fontWeight:700, whiteSpace:"nowrap"}}>
                        <Clock3 size={12}/>{focusLabel}
                      </span>
                    </div>
                    <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:700, color:T.grey900, ...twoLineText}}>{item.name}</p>
                    <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>
                      현재 {item.current_qty}{item.unit} · 7일 {candidate.weekCount}회
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{padding:"0 18px 16px"}}>
              <div style={{border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"14px 12px", color:T.grey500, fontSize:14, lineHeight:"20px"}}>
                최근 출고 기록이 쌓이면 자주 쓰는 품목을 바로 보여드릴게요.
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 필터 탭 */}
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex", background:T.grey100, borderRadius:12, padding:4, gap:2}}>
          {[{id:"all",label:"전체"},{id:"in",label:"입고"},{id:"out",label:"출고"},{id:"adjust",label:"보정"}].map(f=>(
            <button key={f.id} onClick={()=>setTypeFilter(f.id)} style={{flex:1, padding:"12px 0", border:"none", borderRadius:8, background:typeFilter===f.id?T.white:"transparent", boxShadow:typeFilter===f.id?T.shadowSelected:"none", cursor:"pointer", fontFamily:font, fontSize: 14, fontWeight:600, color:typeFilter===f.id?T.grey900:T.grey500, transition:"all 120ms"}}>
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
                        <div style={{width:44, height:44, borderRadius:9999, background:tx.type==="in"?T.blue50:tx.type==="out"?T.red50:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                          {tx.type==="in"
                            ? <ArrowDownToLine size={18} color={T.blue500}/>
                            : tx.type==="out"
                              ? <ArrowUpFromLine size={18} color={T.red500}/>
                              : <SlidersHorizontal size={18} color={T.grey600}/>}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <p style={{margin:0, fontSize: 16, lineHeight:"22px", fontWeight:600, color:T.grey900, ...twoLineText}}>{item?.name}</p>
                          <p style={{margin:"1px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
                            {tx.note||""}
                            {tx.note ? " · " : ""}{tx.user}
                          </p>
                        </div>
                        <div style={{textAlign:"right", flexShrink:0, minWidth:54}}>
                          <p style={{margin:0, fontSize: 16, fontWeight:700, color:tx.type==="in"?T.blue500:tx.type==="out"?T.red500:T.grey700, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>
                            {tx.type==="adjust" && tx.before_qty !== undefined && tx.after_qty !== undefined
                              ? `${tx.before_qty}→${tx.after_qty}`
                              : tx.type==="adjust"
                                ? `보정 ${tx.qty}`
                                : `${tx.type==="in"?"+":"-"}${tx.qty}`}
                          </p>
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

      <div style={{position:"absolute",left:16,right:16,bottom:108,zIndex:20,background:T.white,border:`1px solid ${T.grey200}`,borderRadius:24,padding:8,display:"flex",gap:8,boxShadow:T.shadowFloating}}>
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
