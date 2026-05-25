import { useMemo, useState } from "react";
import { buildAnalyticsData } from "./analyticsTabUtils";
import { InsightCard } from "./AnalyticsCards";
import {
  CategoryCostRows,
  CostDriverRow,
  DataRows,
  PeriodSelector,
  TopCauseRows,
  VendorPurchaseRow,
  WasteRiskRow,
} from "./AnalyticsRows";
import { SecTitle } from "../../shared/SecTitle";
import { T, font } from "../../../constants/colors";

export function AnalyticsTab({ items, txs, orders }) {
  const [period, setPeriod] = useState("current");
  const [analysisMode, setAnalysisMode] = useState("drivers");
  const data = useMemo(
    () => buildAnalyticsData({ items, txs, orders, period }),
    [items, orders, period, txs]
  );
  const maxVendorAmount = Math.max(1, ...data.vendorRows.map(row => row.amount));
  const maxCategoryAmount = Math.max(1, ...data.categoryRows.map(row => row.amount));
  const primaryCauseRows = data.topCauses.slice(0, 1);
  const analysisModes = [
    { id: "drivers", label: "증가" },
    { id: "waste", label: "낭비" },
    { id: "categories", label: "카테고리" },
    { id: "vendors", label: "거래처" },
  ];

  return (
    <div>
      <PeriodSelector period={period} setPeriod={setPeriod} />
      <InsightCard
        totalCost={data.usageCost}
        previousCost={data.previousUsageCost}
        topDriver={data.topDriver}
        pendingAmount={data.pendingAmount}
        wasteRiskAmount={data.wasteRiskAmount}
      />

      <SecTitle>{period === "current" ? "이번 달 가장 큰 원인" : "선택 기간 가장 큰 원인"}</SecTitle>
      <TopCauseRows rows={primaryCauseRows} />

      <div style={{ display:"flex", background:T.grey100, borderRadius:9999, padding:3, margin:"0 0 14px" }}>
        {analysisModes.map(mode => {
          const active = analysisMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setAnalysisMode(mode.id)}
              style={{ flex:1, minHeight:38, borderRadius:9999, border:"none", background:active ? T.white : "transparent", boxShadow:active ? T.shadowControl : "none", color:active ? T.grey900 : T.grey500, fontFamily:font, fontSize:14, fontWeight:active ? 900 : 700, cursor:"pointer" }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {analysisMode === "drivers" && (
        <>
          <SecTitle>증가 품목</SecTitle>
          <DataRows
            rows={data.drivers.filter(row => row.deltaAmount > 0).slice(0, 4)}
            emptyText="이 기간에는 뚜렷한 비용 증가 품목이 없어요."
            renderRow={(row) => <CostDriverRow row={row} />}
          />
        </>
      )}

      {analysisMode === "waste" && (
        <>
          <SecTitle>낭비 위험</SecTitle>
          <DataRows
            rows={data.wasteRows.slice(0, 4)}
            emptyText="30일 내 만료 또는 장기 미사용 과잉재고가 없어요."
            renderRow={(row) => <WasteRiskRow row={row} />}
          />
        </>
      )}

      {analysisMode === "categories" && (
        <>
          <SecTitle>카테고리별 비용</SecTitle>
          <CategoryCostRows
            rows={data.categoryRows.slice(0, 6)}
            maxAmount={maxCategoryAmount}
            emptyText="이 기간에는 카테고리별 사용 비용이 아직 없어요."
          />
        </>
      )}

      {analysisMode === "vendors" && (
        <>
          <SecTitle>거래처별 구매액</SecTitle>
          <DataRows
            rows={data.vendorRows.slice(0, 5)}
            emptyText="이 기간에 승인 또는 입고된 발주가 없어요."
            renderRow={(row) => <VendorPurchaseRow row={row} maxAmount={maxVendorAmount} />}
          />
        </>
      )}
    </div>
  );
}
