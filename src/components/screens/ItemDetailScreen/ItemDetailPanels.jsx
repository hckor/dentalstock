import { ChevronLeft, Pencil, ShoppingCart } from "lucide-react";
import { T, font, CS, monoFont } from "../../../constants/colors";
import { Chip } from "../../shared/Chip";
import { Divider } from "../../shared/Divider";

export function ItemDetailHeader({ item, sc, ao, activeOrderMeta, onClose, onEdit }) {
  return (
    <div style={{background:T.white, padding:"18px 20px", borderBottom:`1px solid ${T.grey100}`}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.grey600, fontFamily:font, fontSize: 16}}>
          <ChevronLeft size={22} color={T.grey600}/> 재고 목록
        </button>
        {onEdit && (
          <button onClick={onEdit} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.blue500, fontFamily:font, fontSize: 16, fontWeight:600}}>
            <Pencil size={16}/> 수정
          </button>
        )}
      </div>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
        <div>
          <h1 style={{margin:0, fontSize: 24, fontWeight:700, color:T.grey900}}>{item.name}</h1>
          <div style={{display:"flex", gap:6, marginTop:6, flexWrap:"wrap"}}>
            <Chip label={sc.label} color={sc.text} bg={sc.bg}/>
            {ao && <Chip label={activeOrderMeta.label} color={activeOrderMeta.text} bg={activeOrderMeta.bg}/>}
            {item.is_temporary && item.temporary_status !== "resolved" && <Chip label="정리 필요" color={T.orange500} bg={T.orange50}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CurrentStockCard({ item, sc }) {
  return (
    <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"20px", marginBottom:12, display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
      <div>
        <p style={{margin:"0 0 4px", fontSize: 14, lineHeight:"22px", color:T.grey500}}>현재 재고</p>
        <p style={{margin:0, fontSize: 34, fontWeight:700, color:sc.text, fontFamily:monoFont, fontVariantNumeric:"tabular-nums", lineHeight:1}}>
          {item.current_qty}
          <span style={{fontSize: 20, fontWeight:400, color:T.grey500, marginLeft:6, fontFamily:font}}>{item.unit}</span>
        </p>
      </div>
      <p style={{margin:0, fontSize: 16, color:T.grey400}}>최소 {item.min_qty}{item.unit}</p>
    </div>
  );
}

export function InfoRowsCard({ rows }) {
  return (
    <div style={{background:T.white, borderRadius:12, boxShadow:CS, marginBottom:12, overflow:"hidden"}}>
      {rows.map((row, i) => (
        <div key={row.label}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px"}}>
            <p style={{margin:0, fontSize: 16, color:T.grey500}}>{row.label}</p>
            <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{row.value}</p>
          </div>
          {i < rows.length-1 && <Divider/>}
        </div>
      ))}
    </div>
  );
}

export function RecommendedMinCard({ item, recentOut7, recentOut30, recommendedMinQty }) {
  return (
    <div style={{background:T.white, borderRadius:12, boxShadow:CS, padding:"16px", marginBottom:12}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
        <div>
          <p style={{margin:0, fontSize:16, lineHeight:"22px", fontWeight:800, color:T.grey900}}>자동 추천 최소 재고</p>
          <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"19px", color:T.grey500}}>최근 7일/30일 출고량 기준</p>
        </div>
        <p style={{margin:0, fontSize:24, lineHeight:"30px", fontWeight:800, color:recommendedMinQty > Number(item.min_qty || 0) ? T.purple500 : T.green500, fontFamily:monoFont}}>
          {recommendedMinQty}{item.unit}
        </p>
      </div>
      <p style={{margin:"10px 0 0", fontSize:13, lineHeight:"19px", color:T.grey600}}>
        현재 기준 {item.min_qty}{item.unit} · 최근 7일 {recentOut7}{item.unit} 출고 · 최근 30일 {recentOut30}{item.unit} 출고
      </p>
    </div>
  );
}

export function BottomActions({ ao, onIn, onOut, onOrder }) {
  return (
    <div style={{position:"sticky", bottom:0, background:T.white, borderTop:`1px solid ${T.grey100}`, padding:"12px 16px 28px", display:"flex", gap:8}}>
      <button onClick={onIn} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>입고</button>
      <button onClick={onOut} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:T.grey100, color:T.red500, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font}}>출고</button>
      <button onClick={onOrder} disabled={!!ao} style={{flex:1, padding:"16px 0", borderRadius:9999, border:"none", background:ao?T.grey100:T.blue50, color:ao?T.grey400:T.blue500, fontSize: 16, fontWeight:600, cursor:ao?"not-allowed":"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}>
        <ShoppingCart size={18}/> 발주
      </button>
    </div>
  );
}
