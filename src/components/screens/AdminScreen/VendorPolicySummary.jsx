import { Clock3, ShoppingCart, WalletCards, Wifi } from "lucide-react";
import { Card } from "../../shared/Card";
import { MetricTile } from "./VendorSettingsTab.components";
import { formatCurrency, formatDateTime, panelGridStyle, sectionTitleStyle } from "./VendorSettingsTab.utils";

export function VendorPolicySummary({
  policySummary,
  vendors,
  credentialStatusLoading,
  monthlyOrderLimit,
  maxOrderAmount,
}) {
  return (
    <>
      <p style={sectionTitleStyle}>주문 정책 요약</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        <div style={panelGridStyle}>
          <MetricTile
            label="연결 거래처"
            value={`${policySummary.connectedCount}/${vendors.length}`}
            detail={credentialStatusLoading ? "상태 확인 중" : "계정 저장 기준"}
            icon={Wifi}
            tone={policySummary.connectedCount > 0 ? "blue" : "grey"}
          />
          <MetricTile
            label="자동발주"
            value={`${policySummary.automaticCount}곳`}
            detail={`정책: ${policySummary.preferredVendorName}`}
            icon={ShoppingCart}
            tone={policySummary.automaticCount > 0 ? "green" : "grey"}
          />
          <MetricTile
            label="월 한도"
            value={formatCurrency(monthlyOrderLimit)}
            detail={`1회 ${formatCurrency(maxOrderAmount)}`}
            icon={WalletCards}
            tone="blue"
          />
          <MetricTile
            label="최근 가격확인"
            value={formatDateTime(policySummary.latestCheckedAt)}
            detail={`${policySummary.uncheckedCount}개 미확인 · ${policySummary.staleCount}개 오래됨`}
            icon={Clock3}
            tone={policySummary.uncheckedCount + policySummary.staleCount > 0 ? "red" : "green"}
          />
        </div>
      </Card>
    </>
  );
}
