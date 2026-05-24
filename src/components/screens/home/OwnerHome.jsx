import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import { ORDER_ST } from "../../../constants/orderStates";
import { T } from "../../../constants/colors";
import { formatMoney as money } from "../../../utils/money";
import { ActionQueue } from "./ActionQueue";
import { OwnerCostStatusCard, OwnerInventoryShortcutCard } from "./OwnerCards";
import { TodaySurgerySection } from "./TodaySurgerySection";
import { countText } from "./homeStyles";

export function OwnerHome(props) {
  const { dashboard, setTab } = props;
  const prepPending = dashboard.surgery.prepPending.length;
  const highCost = dashboard.surgery.highCost[0];
  const ownerReviewCount = dashboard.orders.ownerReview.length;
  const ownerReviewHoldCount = dashboard.orders.ownerReview.filter(order => order.status === "hold").length;
  const holdTone = ORDER_ST.hold;
  const costNeedsReview = dashboard.cost.monthDelta > 0 || dashboard.cost.wasteRiskAmount > 0 || dashboard.cost.fastUsageItems.length > 0;
  const ownerRiskCount = [ownerReviewCount > 0, costNeedsReview, prepPending > 0].filter(Boolean).length;
  const summary = ownerReviewCount > 0
    ? {
        Icon: ClipboardList,
        title: `원장 승인 요청 ${ownerReviewCount}건 먼저 확인`,
        sub: "매니저가 보류로 넘겼거나 원장 승인 기준에 걸린 발주입니다",
        badge: "결재",
        color: holdTone.text,
        bg: holdTone.bg,
      }
    : ownerRiskCount > 0
	    ? {
	        Icon: AlertTriangle,
	        title: `오늘 먼저 볼 경영 신호 ${ownerRiskCount}개`,
	        sub: "비용 흐름과 수술 준비 상태만 먼저 확인하면 됩니다",
	        badge: "확인",
	        color: T.warning,
	        bg: T.warningBg,
	      }
    : {
        Icon: CheckCircle2,
	        title: "비용·수술 흐름이 안정적이에요",
	        sub: "급한 경영 알림은 없고, 아래 핵심 화면에서 세부만 확인하면 됩니다",
	        badge: "안심",
	        color: T.success,
	        bg: T.successBg,
	      };
  const actions = [
    ownerReviewCount > 0 && {
      key: "owner-review",
      Icon: ClipboardList,
      title: `원장 승인 요청 ${ownerReviewCount}건`,
      sub: `검토 금액 ${money(dashboard.orders.ownerReviewAmount)}${ownerReviewHoldCount > 0 ? ` · 보류 ${ownerReviewHoldCount}건` : ""}`,
      value: countText(ownerReviewCount),
      actionLabel: "승인 검토",
      color: holdTone.text,
      iconBg: holdTone.bg,
      bg: T.white,
      urgent: true,
      onClick: () => setTab(ownerReviewHoldCount > 0 ? "shipping:hold" : "shipping"),
    },
    {
      key: "surgery",
      Icon: CalendarDays,
      title: prepPending ? `수술 준비 미완료 ${prepPending}건` : "수술 준비 흐름 정상",
      sub: highCost ? `고비용 예상: ${highCost.title} · ${money(highCost.expectedCost)}` : `이번 주 수술 ${dashboard.surgery.week.length}건`,
	      value: countText(dashboard.surgery.week.length),
	      actionLabel: "수술 보기",
	      color: prepPending ? T.warning : T.primary,
	      iconBg: prepPending ? T.warningBg : T.primaryBg,
      urgent: prepPending > 0,
      onClick: () => setTab("admin:surgery"),
    },
  ].filter(Boolean);

  return (
    <>
      <OwnerCostStatusCard dashboard={dashboard} setTab={setTab} />
      <ActionQueue title="원장 체크포인트" actions={actions} summary={summary} />
      <OwnerInventoryShortcutCard dashboard={dashboard} setTab={setTab} />
      <TodaySurgerySection {...props} title="오늘 수술 리스크" />
    </>
  );
}
