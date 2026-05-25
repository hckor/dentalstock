import { AlertTriangle, CheckCircle2, ClipboardList, PackageCheck, PackageSearch, ShoppingCart, TrendingDown, Users } from "lucide-react";
import { T } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { formatMoney as money } from "../../../utils/money";
import { ActionQueue } from "./ActionQueue";
import { ShortcutGrid } from "./ShortcutGrid";
import { TodaySurgerySection } from "./TodaySurgerySection";
import { countText } from "./homeStyles";

export function ManagerHome(props) {
  const { dashboard, users, setTab } = props;
  const waitingTracking = dashboard.orders.waitingTracking.length;
  const activeUsers = users.filter(user => user.active !== false).length;
  const pendingWithPrice = dashboard.orders.pendingWithPrice.length;
  const inventoryAttention = dashboard.inventory.attentionCount;
  const lowInventoryCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const expirySoonCount = dashboard.inventory.expirySoon.length;
  const managerTaskCount = dashboard.orders.pending.length + waitingTracking + dashboard.orders.delivered.length + inventoryAttention;
  const summary = managerTaskCount > 0
    ? {
        Icon: AlertTriangle,
	        title: `오늘 처리할 운영 항목 ${managerTaskCount}건`,
	        sub: "승인, 송장, 입고 확인, 재고 위험 순서로 보면 됩니다",
	        badge: "처리",
	        color: T.warning,
	        bg: T.warningBg,
	      }
    : {
        Icon: CheckCircle2,
	        title: "승인·입고·재고 상태가 모두 안정적이에요",
	        sub: "급한 승인이나 입고 확인 없이 운영 흐름이 정상입니다",
	        badge: "안심",
	        color: T.success,
	        bg: T.successBg,
      };
  const actions = [
    {
      key: "approval",
      Icon: ClipboardList,
      title: dashboard.orders.pending.length > 0 ? `승인 대기 ${dashboard.orders.pending.length}건` : "승인 대기 없음",
      sub: dashboard.orders.pending.length > 0 ? `대기 금액 ${money(dashboard.orders.pendingAmount)} · 가격 후보 ${pendingWithPrice}건` : "새 발주 요청이 들어오면 여기서 검토합니다",
      value: dashboard.orders.pending.length > 0 ? countText(dashboard.orders.pending.length) : "정상",
      actionLabel: dashboard.orders.pending.length > 0 ? "승인 처리" : "승인 보기",
	      color: dashboard.orders.pending.length > 0 ? ORDER_ST.pending.text : T.success,
	      iconBg: dashboard.orders.pending.length > 0 ? ORDER_ST.pending.bg : T.successBg,
      urgent: dashboard.orders.pending.length > 0,
      onClick: () => setTab("shipping"),
    },
    {
      key: "tracking",
      Icon: ShoppingCart,
      title: waitingTracking > 0 ? `송장 등록 필요 ${waitingTracking}건` : "송장 등록 대기 없음",
      sub: waitingTracking > 0 ? "승인된 발주의 배송 흐름을 이어갑니다" : `입고 대기 품목 ${dashboard.inventory.incoming.length}개만 추적 중입니다`,
      value: waitingTracking > 0 ? countText(waitingTracking) : "정상",
      actionLabel: waitingTracking > 0 ? "송장 등록" : "배송 보기",
	      color: waitingTracking > 0 ? ORDER_ST.ordered.text : T.success,
	      iconBg: waitingTracking > 0 ? ORDER_ST.ordered.bg : T.successBg,
      urgent: waitingTracking > 0,
      onClick: () => setTab("shipping"),
    },
    {
      key: "receipt",
      Icon: PackageCheck,
      title: dashboard.orders.delivered.length > 0 ? `입고 확인 ${dashboard.orders.delivered.length}건` : "입고 확인 대기 없음",
      sub: dashboard.orders.delivered.length > 0 ? "배달완료 후 실제 수량을 확정합니다" : "배송 완료된 발주는 모두 정리됐습니다",
      value: dashboard.orders.delivered.length > 0 ? countText(dashboard.orders.delivered.length) : "정상",
      actionLabel: dashboard.orders.delivered.length > 0 ? "입고 확인" : "입고 보기",
	      color: T.success,
	      iconBg: T.successBg,
      urgent: dashboard.orders.delivered.length > 0,
      onClick: () => setTab("shipping"),
    },
    {
      key: "inventory",
      Icon: PackageSearch,
      title: inventoryAttention > 0 ? `재고 확인 필요 ${inventoryAttention}개` : "재고 위험 신호 없음",
      sub: inventoryAttention > 0 ? (
        <>
	          부족 <span style={{ color: T.warning, fontWeight: 900 }}>{lowInventoryCount}개</span> · 유통기한 <span style={{ color: T.danger, fontWeight: 900 }}>{expirySoonCount}개</span>
        </>
      ) : `입고 대기 ${dashboard.inventory.incoming.length}개 · 부족/임박 품목 없음`,
      value: inventoryAttention > 0 ? countText(inventoryAttention, "개") : "정상",
      actionLabel: "재고 보기",
	      color: inventoryAttention > 0 ? T.warning : T.success,
	      iconBg: inventoryAttention > 0 ? T.warningBg : T.successBg,
      urgent: inventoryAttention > 0,
      onClick: () => setTab("inventory"),
    },
  ];

  return (
    <>
      <ActionQueue title="매니저 처리 큐" actions={actions} summary={summary} quiet />
      <ShortcutGrid
        title="운영 바로가기"
        actions={[
	          { label: "발주 승인", sub: countText(dashboard.orders.pending.length), Icon: ClipboardList, primary: true, color: dashboard.orders.pending.length > 0 ? ORDER_ST.pending.text : T.grey700, onClick: () => setTab("shipping") },
	          { label: "재고 부족", sub: countText(lowInventoryCount, "개"), Icon: PackageSearch, color: lowInventoryCount > 0 ? T.warning : T.grey700, onClick: () => setTab("inventory") },
	          { label: "직원 관리", sub: `${activeUsers}명`, Icon: Users, color: T.primary, onClick: () => setTab("admin:staff") },
	          { label: "가격 후보", sub: countText(pendingWithPrice), Icon: TrendingDown, color: pendingWithPrice > 0 ? T.primary : T.grey700, onClick: () => setTab("shipping") },
        ]}
        quiet
      />
      <TodaySurgerySection {...props} title="수술 준비 상태" />
    </>
  );
}
