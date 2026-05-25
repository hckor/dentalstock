import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, PackageSearch } from "lucide-react";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { ActionQueue } from "./ActionQueue";
import { countText } from "./homeStyles";

export function ManagerHome(props) {
  const { dashboard, setTab } = props;
  const waitingTracking = dashboard.orders.waitingTracking.length;
  const lowInventoryCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const shippingActionCount = waitingTracking + dashboard.orders.delivered.length;
  const orderActionCount = dashboard.orders.pending.length + shippingActionCount;
  const surgeryTodo = dashboard.surgery.todayTodo.length;
  const managerTaskCount = orderActionCount + surgeryTodo + lowInventoryCount;
  const summary = managerTaskCount > 0
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
    {
      key: "orders",
      Icon: ClipboardList,
      title: "발주/입고",
      value: orderActionCount > 0 ? countText(orderActionCount) : "정상",
      actionLabel: dashboard.orders.pending.length > 0 ? "승인" : "확인",
	      color: dashboard.orders.pending.length > 0 ? ORDER_ST.pending.text : shippingActionCount > 0 ? ORDER_ST.ordered.text : T.success,
	      iconBg: dashboard.orders.pending.length > 0 ? ORDER_ST.pending.bg : shippingActionCount > 0 ? ORDER_ST.ordered.bg : T.successBg,
      urgent: orderActionCount > 0,
      onClick: () => setTab("shipping"),
    },
    {
      key: "surgery",
      Icon: CalendarDays,
      title: "수술 운영",
      value: surgeryTodo > 0 ? countText(surgeryTodo) : dashboard.surgery.week.length > 0 ? countText(dashboard.surgery.week.length) : "정상",
      actionLabel: "수술",
	      color: surgeryTodo > 0 ? T.primary : T.success,
	      iconBg: surgeryTodo > 0 ? T.primaryBg : T.successBg,
      urgent: surgeryTodo > 0,
      onClick: () => setTab("admin:surgery"),
    },
    {
      key: "inventory",
      Icon: PackageSearch,
      title: "부족 재고",
      value: lowInventoryCount > 0 ? countText(lowInventoryCount, "개") : "정상",
      actionLabel: "재고",
	      color: lowInventoryCount > 0 ? T.warning : T.success,
	      iconBg: lowInventoryCount > 0 ? T.warningBg : T.successBg,
      urgent: lowInventoryCount > 0,
      onClick: () => setTab("inventory"),
    },
  ];

  return (
    <>
      <ActionQueue title="오늘 할 일" actions={actions} summary={summary} />
    </>
  );
}
