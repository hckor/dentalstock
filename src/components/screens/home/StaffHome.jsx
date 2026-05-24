import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CalendarDays, CheckCircle2, PackageSearch, ShoppingCart } from "lucide-react";
import { T } from "../../../constants/colors";
import { ActionQueue } from "./ActionQueue";
import { ShortcutGrid } from "./ShortcutGrid";
import { TodaySurgerySection } from "./TodaySurgerySection";
import { StatsBar } from "./StatsBar";
import { countText } from "./homeStyles";

export function StaffHome(props) {
  const { dashboard, orders, currentUser, setTab, openModal, canViewSurgery } = props;
  const myOrders = orders.filter(order => order.requested_by === currentUser.name);
  const myActiveOrders = myOrders.filter(order => order.status === "pending" || order.status === "ordered");
  const surgeryTodo = dashboard.surgery.todayTodo.length;
  const lowCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const staffTaskCount = surgeryTodo + lowCount + myActiveOrders.length;
  const summary = staffTaskCount > 0
    ? {
        Icon: AlertTriangle,
        title: `오늘 바로 처리할 현장 항목 ${staffTaskCount}건`,
        sub: "수술 준비, 부족 재고, 내 발주 진행 순서로 확인하면 됩니다",
        badge: "처리",
        color: T.orange500,
        bg: T.orange50,
      }
    : {
        Icon: CheckCircle2,
        title: "오늘 급한 현장 처리 항목은 없어요",
        sub: `입고 ${dashboard.activity.todayIn}개 · 출고 ${dashboard.activity.todayOut}개까지 기록 흐름이 안정적입니다`,
        badge: "안심",
        color: T.green500,
        bg: T.green50,
      };
  const actions = [
    canViewSurgery && {
      key: "surgery",
      Icon: CalendarDays,
      title: surgeryTodo > 0 ? `오늘 수술 준비 ${surgeryTodo}건` : dashboard.surgery.today.length > 0 ? "오늘 수술 준비 완료" : "오늘 예정 수술 없음",
      sub: surgeryTodo > 0 ? "준비 확인과 실사용량 출고를 처리합니다" : `완료 ${dashboard.surgery.todayReadyCount}건 · 미완료 없음`,
      value: surgeryTodo > 0 ? countText(surgeryTodo) : "정상",
      actionLabel: "수술 보기",
      color: surgeryTodo > 0 ? T.blue500 : T.green500,
      iconBg: surgeryTodo > 0 ? T.blue50 : T.green50,
      urgent: surgeryTodo > 0,
      onClick: () => setTab("home"),
    },
    {
      key: "in",
      Icon: ArrowDownToLine,
      title: `오늘 입고 기록 ${dashboard.activity.todayIn}개`,
      sub: "도착한 재료가 있으면 바로 수량을 추가합니다",
      actionLabel: "입고",
      color: T.blue500,
      iconBg: T.blue50,
      onClick: () => openModal?.("in"),
    },
    {
      key: "out",
      Icon: ArrowUpFromLine,
      title: `오늘 출고 기록 ${dashboard.activity.todayOut}개`,
      sub: "진료실 사용분과 폐기 수량을 남깁니다",
      actionLabel: "출고",
      color: T.red500,
      iconBg: T.red50,
      onClick: () => openModal?.("out"),
    },
    {
      key: "order",
      Icon: ShoppingCart,
      title: lowCount > 0 ? `부족 품목 ${lowCount}개` : "부족 품목 없음",
      sub: lowCount > 0 ? "재고 부족 품목을 발주 요청으로 묶습니다" : `입고 대기 ${dashboard.inventory.incoming.length}개 · 재고 목록만 확인하면 됩니다`,
      value: lowCount > 0 ? countText(lowCount, "개") : "정상",
      actionLabel: lowCount > 0 ? "발주 요청" : "재고 보기",
      color: lowCount > 0 ? T.orange500 : T.green500,
      iconBg: lowCount > 0 ? T.orange50 : T.green50,
      urgent: lowCount > 0,
      onClick: () => lowCount > 0 ? openModal?.("bulk_order") : setTab("inventory"),
    },
    {
      key: "my-orders",
      Icon: CheckCircle2,
      title: myActiveOrders.length > 0 ? `내 발주 진행 ${myActiveOrders.length}건` : "내 발주 진행 없음",
      sub: myActiveOrders.length > 0 ? "요청한 발주의 승인/배송 상태를 확인합니다" : "대기 중인 내 발주 요청이 없습니다",
      value: myActiveOrders.length > 0 ? countText(myActiveOrders.length) : "정상",
      actionLabel: myActiveOrders.length > 0 ? "상태 확인" : "발주 보기",
      color: T.teal500,
      iconBg: T.teal50,
      onClick: () => setTab("shipping"),
    },
  ].filter(Boolean);

  return (
    <>
      <ActionQueue title="현장 바로 처리" actions={actions} summary={summary} />
      <TodaySurgerySection {...props} title="오늘 수술 준비" />
      <ShortcutGrid
        title="재고·발주 바로가기"
        actions={[
          { label: "재고 검색", sub: countText(dashboard.inventory.total, "개"), Icon: PackageSearch, onClick: () => setTab("inventory") },
          { label: "입출고 내역", sub: "오늘 기록 확인", Icon: Activity, onClick: () => setTab("inout") },
          { label: "발주 요청", sub: countText(lowCount, "개 부족"), Icon: ShoppingCart, primary: true, onClick: () => openModal?.("bulk_order") },
          { label: "내 발주", sub: countText(myActiveOrders.length), Icon: CheckCircle2, onClick: () => setTab("shipping") },
        ]}
      />
      <StatsBar items={props.items} setTab={setTab} />
    </>
  );
}
