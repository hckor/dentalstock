import { useMemo, useState } from "react";
import { buildAnalyticsData } from "./analyticsTabUtils";
import { InsightCard, AnalyticsSummaryCards } from "./AnalyticsCards";
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

export function AnalyticsTab({ items, txs, orders }) {
  const [period, setPeriod] = useState("current");
  const data = useMemo(
    () => buildAnalyticsData({ items, txs, orders, period }),
    [items, orders, period, txs]
  );
  const maxCategoryAmount = Math.max(1, ...data.categoryRows.map(row => row.amount));
  const maxVendorAmount = Math.max(1, ...data.vendorRows.map(row => row.amount));

  return (
    <div>
      <PeriodSelector period={period} setPeriod={setPeriod} />
      <AnalyticsSummaryCards data={data} />
      <InsightCard
        totalCost={data.usageCost}
        previousCost={data.previousUsageCost}
        topDriver={data.topDriver}
        pendingAmount={data.pendingAmount}
        wasteRiskAmount={data.wasteRiskAmount}
      />

      <SecTitle>{period === "current" ? "이번 달 원인 Top 3" : "선택 기간 원인 Top 3"}</SecTitle>
      <TopCauseRows rows={data.topCauses} />

      {data.categoryRows.length > 0 && (
        <>
          <SecTitle>카테고리별 비용</SecTitle>
          <CategoryCostRows rows={data.categoryRows} maxAmount={maxCategoryAmount} />
        </>
      )}

      <SecTitle>비용 증가 원인</SecTitle>
      <DataRows
        rows={data.drivers.filter(row => row.deltaAmount > 0).slice(0, 4)}
        emptyText="이 기간에는 뚜렷한 비용 증가 품목이 없어요."
        renderRow={(row) => <CostDriverRow row={row} />}
      />

      <SecTitle>낭비 위험 품목</SecTitle>
      <DataRows
        rows={data.wasteRows.slice(0, 4)}
        emptyText="30일 내 만료 또는 장기 미사용 과잉재고가 없어요."
        renderRow={(row) => <WasteRiskRow row={row} />}
      />

      <SecTitle>거래처별 구매액</SecTitle>
      <DataRows
        rows={data.vendorRows.slice(0, 5)}
        emptyText="이 기간에 승인 또는 입고된 발주가 없어요."
        renderRow={(row) => <VendorPurchaseRow row={row} maxAmount={maxVendorAmount} />}
      />
    </div>
  );
}
