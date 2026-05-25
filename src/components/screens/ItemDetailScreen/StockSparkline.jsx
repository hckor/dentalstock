import { useMemo } from "react";
import { T } from "../../../constants/colors";

export function StockSparkline({txs, itemId, minQty}) {
  const W = 280, H = 80, PAD = 8;
  const days = 30;

  const points = useMemo(() => {
    const now = new Date();
    const pts = [];
    let qty = 0;
    const filtered = txs.filter(tx => tx.item_id === itemId).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    for (let d = days; d >= 0; d--) {
      const date = new Date(now - d*86400000).toISOString().slice(0,10);
      const dayTxs = filtered.filter(tx => tx.created_at.slice(0,10) === date);
      dayTxs.forEach(tx => {
        if (tx.type === "in") qty += tx.qty;
        if (tx.type === "out") qty -= tx.qty;
        if (tx.type === "adjust" && Number.isFinite(tx.delta)) qty += tx.delta;
      });
      pts.push({d, qty: Math.max(0, qty)});
    }
    return pts;
  }, [txs, itemId]);

  const now = new Date();
  const maxQty = Math.max(...points.map(p=>p.qty), minQty*2, 1);
  const toX = (d) => PAD + ((days-d)/days)*(W-PAD*2);
  const toY = (q) => H - PAD - (q/maxQty)*(H-PAD*2);

  const pathD = points.map((p,i) => `${i===0?"M":"L"}${toX(p.d)},${toY(p.qty)}`).join(" ");
  const areaD = `${pathD} L${toX(0)},${H-PAD} L${toX(days)},${H-PAD} Z`;
  const labelDates = [
    new Date(now - 28*86400000).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
    new Date(now - 14*86400000).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
    new Date(now).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+18}`} style={{display:"block"}}>
      <line x1={PAD} y1={toY(minQty)} x2={W-PAD} y2={toY(minQty)} stroke={T.grey300} strokeWidth={1} strokeDasharray="4 3"/>
      <text x={W-PAD} y={toY(minQty)-3} textAnchor="end" fontSize={9} fill={T.grey400}>최소 보유량 ({minQty}박스)</text>
      <path d={areaD} fill={T.blue500} opacity={0.08}/>
      <path d={pathD} fill="none" stroke={T.blue500} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      {points.length > 0 && (
        <circle cx={toX(0)} cy={toY(points[points.length-1].qty)} r={3.5} fill={T.blue500}/>
      )}
      <text x={PAD}       y={H+14} fontSize={9} fill={T.grey400}>{labelDates[0]}</text>
      <text x={W/2}       y={H+14} fontSize={9} fill={T.grey400} textAnchor="middle">{labelDates[1]}</text>
      <text x={W-PAD}     y={H+14} fontSize={9} fill={T.grey400} textAnchor="end">{labelDates[2]}</text>
    </svg>
  );
}
