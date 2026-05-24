import { AlertTriangle, CalendarDays, Coins, PackageCheck, TrendingUp } from "lucide-react";
import { T } from "../../../constants/colors";
import { compactMoney, formatMoney } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { SecTitle } from "../../shared/SecTitle";
import { MetricTile, ProjectedStockRow, SummaryRow } from "./SurgeryAdminTab.components";
import { buildSurgeryGuidance } from "./SurgeryAdminTab.utils";

export function SurgeryOperationsSummary({ surgeryInsights }) {
  const riskSubText = surgeryInsights.focusRows.length === 0
    ? "예정 수술 등록 후 확인"
    : surgeryInsights.riskCount
      ? "부족 이유와 보충 행동 표시"
      : "부족 품목 없이 준비 가능";
  const usageSubText = surgeryInsights.hasUsageData
    ? surgeryInsights.usageDelta === 0
      ? "실사용이 예상과 일치"
      : surgeryInsights.usageDelta > 0
        ? "초과 사용 원인 확인 필요"
        : "예상보다 적게 사용"
    : "확정된 사용량이 아직 없음";
  const projectedRiskCount = surgeryInsights.weeklyProjectedStockRows.length;
  const newShortageCount = surgeryInsights.weeklyProjectedStockRows.filter(row => row.isNewShortage).length;
  const projectedRiskSubText = surgeryInsights.weeklyPlannedCount
    ? projectedRiskCount
      ? `수술 영향 신규 ${newShortageCount}종`
      : "최소재고 미달 예상 없음"
    : "이번 주 예정 수술 없음";

  return (
    <>
      <SecTitle>수술 운영 요약</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(132px, 1fr))",gap:8,marginBottom:14}}>
          <MetricTile label={`${surgeryInsights.totalLabel} 수술`} value={`${surgeryInsights.focusRows.length}건`} sub={`등록 ${surgeryInsights.summaries.length}건`} Icon={CalendarDays} color={T.blue500} bg={T.blue50}/>
          <MetricTile label="예상 재료비" value={compactMoney(surgeryInsights.expectedTotal)} sub={surgeryInsights.unpricedCount ? `가격 미등록 ${surgeryInsights.unpricedCount}종 제외` : "최저 단가 기준"} Icon={Coins} color={T.grey900}/>
          <MetricTile label="준비 리스크" value={`${surgeryInsights.riskCount}건`} sub={riskSubText} Icon={AlertTriangle} color={surgeryInsights.riskCount ? T.red500 : T.green500} bg={surgeryInsights.riskCount ? T.red50 : T.green50}/>
          <MetricTile label="수술 후 재고" value={projectedRiskCount ? `${projectedRiskCount}종` : "안정"} sub={projectedRiskSubText} Icon={PackageCheck} color={projectedRiskCount ? T.orange500 : T.green500} bg={projectedRiskCount ? T.orange50 : T.green50}/>
          <MetricTile label="실사용 차이" value={surgeryInsights.hasUsageData ? `${surgeryInsights.usageDelta >= 0 ? "+" : ""}${compactMoney(surgeryInsights.usageDelta)}` : "대기"} sub={usageSubText} Icon={TrendingUp} color={surgeryInsights.usageDelta > 0 ? T.orange500 : T.green500}/>
        </div>

        <div style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${T.grey100}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div style={{minWidth:0}}>
              <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900}}>수술 후 예상 재고</p>
              <p style={{margin:"2px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500}}>수술 때문에 부족해질 품목 Top 리스트와 required_items 차감 후 최소재고 미달 예측</p>
            </div>
            <span style={{borderRadius:9999,padding:"5px 10px",background:projectedRiskCount ? T.orange50 : T.green50,color:projectedRiskCount ? T.orange500 : T.green500,fontSize:13,lineHeight:"18px",fontWeight:800,whiteSpace:"nowrap"}}>
              {projectedRiskCount ? `Top ${Math.min(4, projectedRiskCount)}` : "미달 없음"}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:10}}>
            <ProjectedStockColumn title="오늘 예정 수술 후" emptyTitle="최소재고 유지" emptyBody={surgeryInsights.todayPlannedCount ? "오늘 수술 차감 후에도 미달 예상 품목이 없어요." : "오늘 예정 수술이 없어요."} rows={surgeryInsights.todayProjectedStockRows.slice(0, 3)}/>
            <ProjectedStockColumn title="이번 주 누적 수술 후" emptyTitle="부족 전환 없음" emptyBody={surgeryInsights.weeklyPlannedCount ? "이번 주 예정 수술 차감 후 최소재고를 유지해요." : "이번 주 예정 수술이 없어요."} rows={surgeryInsights.weeklyProjectedStockRows.slice(0, 4)}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:14}}>
          <HighCostRows rows={surgeryInsights.highCostRows}/>
          <RiskRows rows={surgeryInsights.riskRows}/>
        </div>
        <UsageRows rows={surgeryInsights.usageRows}/>
      </Card>
    </>
  );
}

function ProjectedStockColumn({ title, emptyTitle, emptyBody, rows }) {
  return (
    <div style={{minWidth:0}}>
      <p style={{margin:"0 0 7px",fontSize:13,lineHeight:"18px",fontWeight:800,color:T.grey700}}>{title}</p>
      {rows.length === 0 ? (
        <div style={{borderRadius:12,background:T.green50,padding:"12px 13px"}}>
          <p style={{margin:0,fontSize:14,lineHeight:"20px",fontWeight:800,color:T.green500}}>{emptyTitle}</p>
          <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600}}>{emptyBody}</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {rows.map(row => <ProjectedStockRow key={row.id} row={row}/>)}
        </div>
      )}
    </div>
  );
}

function HighCostRows({ rows }) {
  return (
    <div style={{minWidth:0}}>
      <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>고비용 수술</p>
      {rows.length === 0 ? (
        <p style={{margin:0,padding:"12px 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>가격이 등록된 수술 품목이 아직 없어요.</p>
      ) : rows.map((summary, index) => (
        <div key={summary.surgery.id}>
          <SummaryRow title={summary.surgery.title} sub={`${summary.surgery.scheduled_date} ${summary.surgery.scheduled_time} · 품목 ${summary.requiredRows.length}개`} value={formatMoney(summary.expectedCost)} tone={summary.shortageCount ? "danger" : "default"}/>
          {index < rows.length - 1 && <Divider/>}
        </div>
      ))}
    </div>
  );
}

function RiskRows({ rows }) {
  return (
    <div style={{minWidth:0}}>
      <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>준비 리스크</p>
      {rows.length === 0 ? (
        <p style={{margin:0,padding:"12px 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>부족 품목이 없어 예정 수술 준비가 안정적이에요. 다음 행동: 일정 전 최종 확인만 하면 돼요.</p>
      ) : rows.map((summary, index) => {
        const guidance = buildSurgeryGuidance(summary);
        return (
          <div key={summary.surgery.id}>
            <SummaryRow title={summary.surgery.title} sub={guidance.reason} value={`부족 ${summary.shortageCount}종`} tone="danger" action={guidance.action}/>
            {index < rows.length - 1 && <Divider/>}
          </div>
        );
      })}
    </div>
  );
}

function UsageRows({ rows }) {
  return (
    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.grey100}`}}>
      <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>예상 vs 실사용</p>
      {rows.length === 0 ? (
        <p style={{margin:0,padding:"8px 0 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>확정된 사용량이 아직 없어요. 다음 행동: 수술 후 실제 사용량을 입력하면 차이를 바로 확인할 수 있어요.</p>
      ) : rows.map((summary, index) => {
        const isOver = summary.deltaCost > 0;
        const isSame = summary.deltaCost === 0;
        const guidance = buildSurgeryGuidance(summary);
        return (
          <div key={summary.surgery.id}>
            <SummaryRow title={summary.surgery.title} sub={`예상 ${formatMoney(summary.expectedCost)} · 실사용 ${formatMoney(summary.actualCost)}`} value={isSame ? "동일" : `${isOver ? "+" : "-"}${formatMoney(Math.abs(summary.deltaCost))}`} tone={isSame ? "success" : isOver ? "warning" : "success"} action={guidance.action}/>
            {index < rows.length - 1 && <Divider/>}
          </div>
        );
      })}
    </div>
  );
}
