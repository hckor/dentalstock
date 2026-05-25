import { AlertTriangle, CheckCircle2, ClipboardList, PackageSearch, ReceiptText } from "lucide-react";
import { ORDER_ST } from "../../../constants/orderStates";
import { T } from "../../../constants/colors";
import { ActionQueue } from "./ActionQueue";
import { countText } from "./homeStyles";

export function OwnerHome(props) {
  const { dashboard, setTab } = props;
  const ownerReviewCount = dashboard.orders.ownerReview.length;
  const ownerReviewHoldCount = dashboard.orders.ownerReview.filter(order => order.status === "hold").length;
  const holdTone = ORDER_ST.hold;
  const costSignalCount = [
    dashboard.cost.monthDelta > 0,
    dashboard.cost.wasteRiskAmount > 0,
    dashboard.cost.fastUsageItems.length > 0,
  ].filter(Boolean).length;
  const inventoryRiskCount = dashboard.inventory.attentionCount;
  const ownerTaskCount = ownerReviewCount + costSignalCount + inventoryRiskCount;
  const summary = ownerTaskCount > 0
    ? {
	        Icon: AlertTriangle,
	        title: "오늘 처리 필요",
	        badge: "처리",
	        color: ownerReviewCount > 0 ? holdTone.text : T.warning,
	        bg: ownerReviewCount > 0 ? holdTone.bg : T.warningBg,
	      }
    : {
        Icon: CheckCircle2,
	        title: "오늘 처리 안정",
	        badge: "안심",
	        color: T.success,
	        bg: T.successBg,
	      };
  const actions = [
    {
      key: "owner-review",
      Icon: ClipboardList,
      title: "승인 검토",
      value: ownerReviewCount > 0 ? countText(ownerReviewCount) : "0건",
      actionLabel: "검토",
      color: ownerReviewCount > 0 ? holdTone.text : T.success,
      iconBg: ownerReviewCount > 0 ? holdTone.bg : T.successBg,
      bg: T.white,
      urgent: ownerReviewCount > 0,
      onClick: () => setTab(ownerReviewHoldCount > 0 ? "shipping:hold" : "shipping"),
    },
    {
      key: "cost",
      Icon: ReceiptText,
      title: "비용 이상",
      value: costSignalCount > 0 ? countText(costSignalCount, "개") : "정상",
      actionLabel: "확인",
      color: costSignalCount > 0 ? T.warning : T.success,
      iconBg: costSignalCount > 0 ? T.warningBg : T.successBg,
      urgent: costSignalCount > 0,
      onClick: () => setTab("admin:analytics"),
    },
    {
      key: "inventory-risk",
      Icon: PackageSearch,
      title: "위험 품목",
      value: inventoryRiskCount > 0 ? countText(inventoryRiskCount, "개") : "정상",
      actionLabel: "재고",
      color: inventoryRiskCount > 0 ? T.warning : T.success,
      iconBg: inventoryRiskCount > 0 ? T.warningBg : T.successBg,
      urgent: inventoryRiskCount > 0,
      onClick: () => setTab("inventory"),
    },
  ];

  return (
    <>
      <ActionQueue title="오늘 할 일" actions={actions} summary={summary} />
    </>
  );
}
