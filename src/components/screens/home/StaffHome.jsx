import { AlertTriangle, ArrowUpFromLine, CalendarDays, CheckCircle2, ShoppingCart } from "lucide-react";
import { T } from "../../../constants/colors";
import { ActionQueue } from "./ActionQueue";
import { TodaySurgerySection } from "./TodaySurgerySection";
import { countText } from "./homeStyles";

const TODAY_SURGERY_ANCHOR = "today-surgery-section";

export function StaffHome(props) {
  const { dashboard, setTab, openModal, canViewSurgery } = props;
  const surgeryTodo = dashboard.surgery.todayTodo.length;
  const lowCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const staffTaskCount = surgeryTodo + lowCount;
  const summary = staffTaskCount > 0
    ? {
        Icon: AlertTriangle,
        title: "오늘 처리 필요",
        badge: "처리",
	        color: T.warning,
	        bg: T.warningBg,
      }
    : {
        Icon: CheckCircle2,
        title: "오늘 처리 안정",
        badge: "안심",
	        color: T.success,
	        bg: T.successBg,
      };
  const actions = [
    canViewSurgery && dashboard.surgery.today.length > 0 && {
      key: "surgery",
      Icon: CalendarDays,
      title: "오늘 수술",
      value: surgeryTodo > 0 ? countText(surgeryTodo) : "정상",
      actionLabel: "수술",
      color: surgeryTodo > 0 ? T.primary : T.success,
      iconBg: surgeryTodo > 0 ? T.primaryBg : T.successBg,
      urgent: surgeryTodo > 0,
      onClick: () => document.getElementById(TODAY_SURGERY_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      key: "out",
      Icon: ArrowUpFromLine,
      title: "빠른 출고",
      value: countText(dashboard.activity.todayOut, "개"),
      actionLabel: "출고",
	      color: T.danger,
	      iconBg: T.dangerBg,
      onClick: () => openModal?.("out"),
    },
    {
      key: "order",
      Icon: ShoppingCart,
      title: "발주 요청",
      value: lowCount > 0 ? countText(lowCount, "개") : "정상",
      actionLabel: lowCount > 0 ? "요청" : "재고",
	      color: lowCount > 0 ? T.warning : T.success,
	      iconBg: lowCount > 0 ? T.warningBg : T.successBg,
      urgent: lowCount > 0,
      onClick: () => lowCount > 0 ? openModal?.("bulk_order") : setTab("inventory"),
    },
  ].filter(Boolean);

  return (
    <>
      <ActionQueue title="오늘 할 일" actions={actions} summary={summary} />
      {canViewSurgery && <TodaySurgerySection {...props} title="오늘 수술 준비" anchorId={TODAY_SURGERY_ANCHOR} />}
    </>
  );
}
