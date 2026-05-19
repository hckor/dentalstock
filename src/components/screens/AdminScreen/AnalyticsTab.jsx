import { useState, useMemo } from "react";
import { T, font, monoFont, CS } from "../../../constants/colors";
import { CATEGORIES } from "../../../constants/categories";
import { pct } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { SecTitle } from "../../shared/SecTitle";

const PERIODS = [
  { id: "current", label: "이번 달" },
  { id: "prev",    label: "지난 달" },
  { id: "3months", label: "3개월" },
];

function getPeriodRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  // 3months
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  return { start, end: now };
}

function getPrevRange(period) {
  const now = new Date();
  if (period === "current") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }
  if (period === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
  return { start, end };
}

export function AnalyticsTab({items, txs, orders}) {
  const [period, setPeriod] = useState("current");

  const { periodOut, totalUsed, prevTotalUsed, avgPerDay, orderCount } = useMemo(() => {
    const range = getPeriodRange(period);
    const prev  = getPrevRange(period);
    const outTxs = txs.filter(tx => tx.type === "out");
    const periodOut = outTxs.filter(tx => {
      const d = new Date(tx.created_at);
      return d >= range.start && d <= range.end;
    });
    const prevTotalUsed = outTxs
      .filter(tx => { const d = new Date(tx.created_at); return d >= prev.start && d <= prev.end; })
      .reduce((s, tx) => s + tx.qty, 0);
    const totalUsed = periodOut.reduce((s, tx) => s + tx.qty, 0);
    const days = Math.max(1, Math.round((range.end - range.start) / 86400000));
    const avgPerDay = totalUsed > 0 ? (totalUsed / days).toFixed(1) : "0.0";
    const orderCount = orders.filter(o => {
      const d = new Date(o.requested_at);
      return d >= range.start && d <= range.end;
    }).length;
    return { periodOut, totalUsed, prevTotalUsed, avgPerDay, orderCount };
  }, [period, txs, orders]);

  const delta = totalUsed - prevTotalUsed;

  const byItem = useMemo(() => {
    return items.map(item => {
      const used = periodOut.filter(tx => tx.item_id === item.id).reduce((s, tx) => s + tx.qty, 0);
      const allOut = txs.filter(tx => tx.type === "out" && tx.item_id === item.id);
      const threeMonthUsed = allOut.reduce((s, tx) => s + tx.qty, 0);
      const monthlyAvg = Math.max(0.1, threeMonthUsed / 4);
      const expectedDays = Math.round((item.current_qty / monthlyAvg) * 30);
      return { ...item, used, expectedDays };
    }).sort((a, b) => b.used - a.used).filter(i => i.used > 0);
  }, [items, periodOut, txs]);

  const maxUsed = Math.max(1, ...byItem.map(i => i.used));

  const byCat = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catItemIds = items.filter(i => i.category_id === cat.id).map(i => i.id);
      const used = periodOut.filter(tx => catItemIds.includes(tx.item_id)).reduce((s, tx) => s + tx.qty, 0);
      return { ...cat, used };
    }).filter(c => c.used > 0);
  }, [items, periodOut]);

  const stats = [
    {
      label: "총사용량",
      value: totalUsed,
      unit: "개",
      delta: delta !== 0 ? (
        <Chip
          label={`${delta > 0 ? "+" : ""}${delta}`}
          color={delta > 0 ? T.red500 : T.green500}
          bg={delta > 0 ? T.red50 : T.green50}
          border={delta > 0 ? T.red50 : T.green50}
        />
      ) : null,
    },
    { label: "평균/일", value: avgPerDay, unit: "개" },
    { label: "발주횟수", value: orderCount, unit: "회" },
  ];

  return (
    <div>
      {/* 기간 탭 */}
      <div style={{display:"flex", background:"#f1f5f9", borderRadius:12, padding:3, marginBottom:16}}>
        {PERIODS.map(p => {
          const active = p.id === period;
          return (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{flex:1, padding:"14px 0", borderRadius:9, border:"none", background:active ? T.white : "transparent", boxShadow:active ? "0px 1px 3px rgba(0,0,0,0.1)" : "none", cursor:"pointer", fontFamily:font, fontSize: 16, fontWeight:active ? 700 : 500, color:active ? T.grey900 : T.grey500, transition:"all 120ms"}}>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 3개 통계 카드 */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16}}>
        {stats.map(s => (
          <div key={s.label} style={{background:T.white, borderRadius:12, padding:"14px 12px", boxShadow:CS}}>
            <p style={{margin:"0 0 6px", fontSize: 16, color:T.grey500, fontWeight:500}}>{s.label}</p>
            <p style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900, fontFamily:monoFont, fontVariantNumeric:"tabular-nums", lineHeight:"1"}}>{s.value}<span style={{fontSize: 16, fontWeight:400, color:T.grey400, fontFamily:font}}>{s.unit}</span></p>
            {s.delta && <div style={{marginTop:6}}>{s.delta}</div>}
          </div>
        ))}
      </div>

      {/* 카테고리별 누적 바 */}
      {byCat.length > 0 && (
        <>
          <SecTitle>카테고리별 출고</SecTitle>
          <Card style={{marginBottom:16, padding:"16px"}}>
            {/* 누적 바 */}
            <div style={{display:"flex", height:12, borderRadius:9999, overflow:"hidden", marginBottom:14, gap:2}}>
              {byCat.map(cat => (
                <div key={cat.id} style={{flex:cat.used, background:cat.color, transition:"flex 300ms"}}/>
              ))}
            </div>
            {/* 범례 */}
            <div style={{display:"flex", flexWrap:"wrap", gap:"8px 16px"}}>
              {byCat.map(cat => (
                <div key={cat.id} style={{display:"flex", alignItems:"center", gap:5}}>
                  <div style={{width:8, height:8, borderRadius:9999, background:cat.color, flexShrink:0}}/>
                  <span style={{fontSize: 16, color:T.grey600, fontWeight:500}}>{cat.name}</span>
                  <span style={{fontSize: 16, fontWeight:700, color:T.grey800, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{cat.used}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* 많이 사용한 품목 Top 5 */}
      <SecTitle>많이 사용한 품목</SecTitle>
      {byItem.length === 0 ? (
        <Card>
          <p style={{margin:0, padding:"24px 16px", fontSize: 16, color:T.grey500, textAlign:"center"}}>이 기간에 출고 기록이 없어요.</p>
        </Card>
      ) : (
        <Card style={{marginBottom:16}}>
          {byItem.slice(0, 5).map((item, i) => (
            <div key={item.id}>
              <div style={{padding:"18px 20px"}}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
                  <span style={{fontSize: 16, fontWeight:700, color:T.grey300, minWidth:16, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{i + 1}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                    <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey500}}>예상 소진 {item.expectedDays}일</p>
                  </div>
                  <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.grey900, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{item.used}<span style={{fontSize: 16, fontWeight:400, color:T.grey500, fontFamily:font}}>{item.unit}</span></p>
                </div>
                <div style={{height:6, borderRadius:9999, background:T.grey100, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${pct(item.used, maxUsed)}%`, background:T.blue500, borderRadius:9999, transition:"width 300ms"}}/>
                </div>
              </div>
              {i < Math.min(5, byItem.length) - 1 && <Divider/>}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
