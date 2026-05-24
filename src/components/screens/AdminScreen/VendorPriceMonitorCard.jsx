import { AlertTriangle, Clock3, Link2, RefreshCcw, Truck } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { MetricTile } from "./VendorSettingsTab.components";
import { formatDateTime, panelGridStyle, PRICE_STALE_DAYS, sectionTitleStyle } from "./VendorSettingsTab.utils";

export function VendorPriceMonitorCard({ monitorSummary, policySummary, monitorRunning, onRunPriceMonitor }) {
  return (
    <>
      <p style={sectionTitleStyle}>최저가 감시</p>
      <Card style={{ marginBottom: 20, padding: "18px 16px" }}>
        <div style={{ ...panelGridStyle, marginBottom: 14 }}>
          <MetricTile label="감시 품목" value={`${monitorSummary.monitoredCount}개`} detail="구매 후보 등록 품목" icon={Link2} tone="blue"/>
          <MetricTile label="구매 후보" value={`${monitorSummary.candidateCount}개`} detail="거래처별 가격 옵션" icon={Truck} tone="grey"/>
          <MetricTile label="오래된 가격" value={`${policySummary.staleCount}개`} detail={`${PRICE_STALE_DAYS}일 이상 미갱신`} icon={AlertTriangle} tone={policySummary.staleCount > 0 ? "red" : "green"}/>
          <MetricTile label="미확인 가격" value={`${policySummary.uncheckedCount}개`} detail={formatDateTime(policySummary.latestCheckedAt)} icon={Clock3} tone={policySummary.uncheckedCount > 0 ? "red" : "green"}/>
        </div>
        <button
          type="button"
          onClick={onRunPriceMonitor}
          disabled={monitorRunning || monitorSummary.candidateCount === 0}
          style={{width:"100%", minHeight:46, marginBottom:14, border:"none", borderRadius:9999, background:monitorRunning || monitorSummary.candidateCount === 0 ? T.grey200 : T.blue500, color:monitorRunning || monitorSummary.candidateCount === 0 ? T.grey500 : T.white, fontSize:15, fontWeight:700, fontFamily:font, cursor:monitorRunning || monitorSummary.candidateCount === 0 ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7}}
        >
          <RefreshCcw size={16}/>
          {monitorRunning ? "가격 확인 중..." : "가격 지금 확인"}
        </button>
        {monitorSummary.lowStockRecommendations.length > 0 ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {monitorSummary.lowStockRecommendations.map(({item, qty, vendor}) => (
              <div key={item.id} style={{padding:"12px 0", borderTop:`1px solid ${T.grey100}`}}>
                <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{item.name}</p>
                <p style={{margin:"4px 0 0", fontSize:13, color:T.grey500}}>
                  추천 {vendor.vendor_name} · {qty}{item.unit} · 실효가 {Number(vendor.vendor_price || 0).toLocaleString()}원
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{margin:0, fontSize:14, color:T.grey500, lineHeight:1.5}}>
            품목 수정 화면에서 구매 후보 URL과 가격을 등록하면 부족 품목 발주 시 최저가 거래처가 자동 추천됩니다.
          </p>
        )}
      </Card>
    </>
  );
}
