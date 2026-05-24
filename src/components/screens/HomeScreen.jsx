import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  PackageSearch,
  ShoppingCart,
  TrendingDown,
  Users,
} from "lucide-react";
import { can } from "../../constants/permissions";
import { T, font, monoFont } from "../../constants/colors";
import { buildHomeDashboard } from "../../utils/homeDashboard";
import { formatMoney as money, toNumber } from "../../utils/money";
import { SecTitle } from "../shared/SecTitle";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { TodaySurgeryCard } from "./home/TodaySurgeryCard";
import { StatsBar } from "./home/StatsBar";

const pagePad = { padding: "16px 16px 0" };
const oneLine = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const twoLine = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

const countText = (value, unit = "건") => `${Number(value) || 0}${unit}`;
const signedMoney = (value) => {
  const amount = Math.round(toNumber(value));
  if (amount === 0) return "변동 없음";
  return `${amount > 0 ? "+" : "-"}${money(Math.abs(amount))}`;
};

function ActionQueue({ title = "바로 처리", actions, summary, emptyText = "지금 바로 처리할 항목이 없어요", quiet = false }) {
  const SummaryIcon = summary?.Icon || CheckCircle2;
  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      <Card style={{ overflow: "hidden", padding: 0 }}>
        {summary && (
          <div style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, background: quiet ? T.white : summary.bg || T.grey50 }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: quiet ? T.grey50 : T.white, color: summary.color || T.green500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SummaryIcon size={19} color="currentColor" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, ...twoLine }}>{summary.title}</span>
              <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "19px", color: T.grey600, ...twoLine }}>{summary.sub}</span>
            </span>
            {summary.badge && (
              <span style={{ flexShrink: 0, border: quiet ? `1px solid ${T.grey200}` : "none", borderRadius: 9999, padding: "7px 9px", background: quiet ? T.grey50 : T.white, color: summary.color || T.green500, fontSize: 12, lineHeight: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
                {summary.badge}
              </span>
            )}
          </div>
        )}
        {summary && actions.length > 0 && <Divider />}
        {actions.length === 0 ? (
          <p style={{ margin: 0, padding: "24px 16px", fontSize: 15, color: T.grey500, textAlign: "center" }}>{emptyText}</p>
        ) : actions.map((action, index) => {
          const Icon = action.Icon || Activity;
          return (
            <div key={action.key || action.title}>
              <button
                type="button"
                onClick={action.onClick}
                style={{
                  width: "100%",
                  border: "none",
                  background: quiet ? T.white : action.urgent ? action.bg || T.orange50 : T.white,
                  padding: "15px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  fontFamily: font,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 42, height: 42, borderRadius: 14, background: quiet ? T.grey50 : action.iconBg || T.blue50, color: action.color || T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color="currentColor" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey900, ...twoLine }}>{action.title}</span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 14, lineHeight: "20px", color: T.grey500, ...twoLine }}>{action.sub}</span>
                </span>
                <span style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
                  {action.value && <span style={{ fontSize: 16, fontWeight: 800, color: action.color || T.grey900, fontFamily: monoFont }}>{action.value}</span>}
                  <span style={{ minWidth: 82, boxSizing: "border-box", border: "none", padding: "9px 12px", borderRadius: 9999, background: action.color || T.blue500, color: T.white, fontSize: 13, lineHeight: "18px", fontWeight: 800, textAlign: "center", whiteSpace: "nowrap" }}>
                    {action.actionLabel}
                  </span>
                </span>
              </button>
              {index < actions.length - 1 && <Divider />}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function ShortcutGrid({ title = "빠른 실행", actions, quiet = false }) {
  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {actions.map(action => {
          const Icon = action.Icon;
          const quietColor = action.color || (action.primary ? T.blue500 : T.grey700);
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              style={{
                minHeight: 68,
                border: quiet ? `1px solid ${action.primary ? `${quietColor}55` : T.grey200}` : "none",
                borderRadius: 14,
                background: quiet ? T.white : action.primary ? T.blue500 : T.white,
                color: quiet ? T.grey800 : action.primary ? T.white : T.grey800,
                boxShadow: T.shadowCard,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                fontFamily: font,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              <Icon size={20} color={quiet ? quietColor : "currentColor"} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, lineHeight: "20px", fontWeight: 800, color: quiet ? T.grey900 : undefined, ...oneLine }}>{action.label}</span>
                {action.sub && <span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: "17px", color: quiet ? T.grey500 : undefined, opacity: quiet ? 1 : action.primary ? 0.82 : 0.58, fontWeight: 700, ...oneLine }}>{action.sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TodaySurgerySection({ title = "오늘 수술 준비", dashboard, items, canManageSurgery, canConfirmSurgery, confirmSurgeryPrep, confirmSurgeryUsage, openItemsEditor, updateSurgeryItems }) {
  if (dashboard.surgery.today.length === 0) return null;

  return (
    <div style={pagePad}>
      <SecTitle>{title}</SecTitle>
      {dashboard.surgery.today.map(surgery => (
        <TodaySurgeryCard
          key={surgery.id}
          surgery={surgery}
          items={items}
          confirmSurgeryPrep={confirmSurgeryPrep}
          confirmSurgeryUsage={confirmSurgeryUsage}
          openItemsEditor={openItemsEditor}
          updateSurgeryItems={updateSurgeryItems}
          canManage={canManageSurgery}
          canConfirm={canConfirmSurgery}
        />
      ))}
    </div>
  );
}

function OwnerCostStatusCard({ dashboard, setTab }) {
  const delta = dashboard.cost.monthDelta;
  const hasIncrease = delta > 0;
  const hasWasteRisk = dashboard.cost.wasteRiskAmount > 0;
  const pendingAmount = dashboard.orders.pendingAmount;
  const status = hasIncrease || hasWasteRisk || pendingAmount > 0
    ? {
        label: hasIncrease ? "증가 확인" : hasWasteRisk ? "낭비 위험" : "승인 대기",
        color: hasIncrease ? T.orange500 : hasWasteRisk ? T.red500 : T.blue500,
        bg: hasIncrease ? T.orange50 : hasWasteRisk ? T.red50 : T.blue50,
      }
    : {
        label: "안정",
        color: T.green500,
        bg: T.green50,
      };
  const deltaText = delta === 0 ? "전월과 동일" : `전월 대비 ${signedMoney(delta)}`;
  const metrics = [
    { label: "승인 대기", value: money(pendingAmount), color: pendingAmount > 0 ? T.orange500 : T.green500 },
    { label: "낭비 위험", value: money(dashboard.cost.wasteRiskAmount), color: hasWasteRisk ? T.red500 : T.green500 },
    { label: "절감 추정", value: money(dashboard.cost.estimatedSavings), color: dashboard.cost.estimatedSavings > 0 ? T.green500 : T.grey700 },
  ];

  return (
    <div style={pagePad}>
      <SecTitle>비용 상태</SecTitle>
      <button
        type="button"
        onClick={() => setTab("admin:analytics")}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          background: T.white,
          boxShadow: T.shadowCard,
          padding: 16,
          textAlign: "left",
          fontFamily: font,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", fontSize: 13, lineHeight: "18px", fontWeight: 800, color: T.grey500 }}>이번 달 재료비</p>
            <p style={{ margin: 0, fontSize: 30, lineHeight: "36px", fontWeight: 900, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
              {money(dashboard.cost.monthlySpend)}
            </p>
            <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 800, color: hasIncrease ? T.orange500 : delta < 0 ? T.green500 : T.grey500 }}>
              {deltaText}
            </p>
          </div>
          <span style={{ flexShrink: 0, borderRadius: 9999, padding: "7px 10px", background: status.bg, color: status.color, fontSize: 13, lineHeight: "18px", fontWeight: 900, whiteSpace: "nowrap" }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "10px 9px" }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey500, ...oneLine }}>{metric.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 900, color: metric.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 12, color: T.blue500, fontSize: 13, lineHeight: "18px", fontWeight: 900 }}>
          비용 상세
          <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}

function OwnerInventoryShortcutCard({ dashboard, setTab }) {
  const lowCount = dashboard.inventory.low.length + dashboard.inventory.out.length;
  const expiryCount = dashboard.inventory.expirySoon.length;
  const incomingCount = dashboard.inventory.incoming.length;
  const needsAttention = dashboard.inventory.attentionCount > 0;
  const status = needsAttention
    ? { label: "확인 필요", color: T.orange500, bg: T.orange50 }
    : { label: "안정", color: T.green500, bg: T.green50 };
  const metrics = [
    { label: "부족", value: countText(lowCount, "개"), color: lowCount > 0 ? T.red500 : T.green500 },
    { label: "유통기한", value: countText(expiryCount, "개"), color: expiryCount > 0 ? T.orange500 : T.green500 },
    { label: "입고대기", value: countText(incomingCount, "개"), color: incomingCount > 0 ? T.blue500 : T.green500 },
  ];

  return (
    <div style={pagePad}>
      <SecTitle>재고 현황</SecTitle>
      <button
        type="button"
        onClick={() => setTab("inventory")}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          background: T.white,
          boxShadow: T.shadowCard,
          padding: 15,
          textAlign: "left",
          fontFamily: font,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: status.bg, color: status.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PackageSearch size={20} color="currentColor" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, lineHeight: "22px", fontWeight: 900, color: T.grey900, ...oneLine }}>
              {needsAttention ? `확인 필요 ${dashboard.inventory.attentionCount}개` : "재고 위험 신호 없음"}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 13, lineHeight: "18px", fontWeight: 700, color: T.grey500, ...oneLine }}>
              전체 {dashboard.inventory.total}개 품목
            </span>
          </span>
          <span style={{ flexShrink: 0, borderRadius: 9999, padding: "7px 10px", background: status.bg, color: status.color, fontSize: 13, lineHeight: "18px", fontWeight: 900, whiteSpace: "nowrap" }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{ minWidth: 0, borderRadius: 12, background: T.grey50, padding: "9px 8px" }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: "17px", fontWeight: 800, color: T.grey500, ...oneLine }}>{metric.label}</p>
              <p style={{ margin: "3px 0 0", fontSize: 15, lineHeight: "20px", fontWeight: 900, color: metric.color, fontFamily: monoFont, fontVariantNumeric: "tabular-nums", ...oneLine }}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 11, color: T.blue500, fontSize: 13, lineHeight: "18px", fontWeight: 900 }}>
          재고 보기
          <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}

function OwnerHome(props) {
  const { dashboard, setTab } = props;
  const prepPending = dashboard.surgery.prepPending.length;
  const highCost = dashboard.surgery.highCost[0];
  const costNeedsReview = dashboard.cost.monthDelta > 0 || dashboard.cost.wasteRiskAmount > 0 || dashboard.cost.fastUsageItems.length > 0;
  const ownerRiskCount = [costNeedsReview, prepPending > 0].filter(Boolean).length;
  const summary = ownerRiskCount > 0
    ? {
        Icon: AlertTriangle,
        title: `오늘 먼저 볼 경영 신호 ${ownerRiskCount}개`,
        sub: "비용 흐름과 수술 준비 상태만 먼저 확인하면 됩니다",
        badge: "확인",
        color: T.orange500,
        bg: T.orange50,
      }
    : {
        Icon: CheckCircle2,
        title: "비용·수술 흐름이 안정적이에요",
        sub: "급한 경영 알림은 없고, 아래 핵심 화면에서 세부만 확인하면 됩니다",
        badge: "안심",
        color: T.green500,
        bg: T.green50,
      };
  const actions = [
    {
      key: "surgery",
      Icon: CalendarDays,
      title: prepPending ? `수술 준비 미완료 ${prepPending}건` : "수술 준비 흐름 정상",
      sub: highCost ? `고비용 예상: ${highCost.title} · ${money(highCost.expectedCost)}` : `이번 주 수술 ${dashboard.surgery.week.length}건`,
      value: countText(dashboard.surgery.week.length),
      actionLabel: "수술 보기",
      color: prepPending ? T.orange500 : T.blue500,
      iconBg: prepPending ? T.orange50 : T.blue50,
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

function ManagerHome(props) {
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
        color: T.orange500,
        bg: T.orange50,
      }
    : {
        Icon: CheckCircle2,
        title: "승인·입고·재고 상태가 모두 안정적이에요",
        sub: "급한 승인이나 입고 확인 없이 운영 흐름이 정상입니다",
        badge: "안심",
        color: T.green500,
        bg: T.green50,
      };
  const actions = [
    {
      key: "approval",
      Icon: ClipboardList,
      title: dashboard.orders.pending.length > 0 ? `승인 대기 ${dashboard.orders.pending.length}건` : "승인 대기 없음",
      sub: dashboard.orders.pending.length > 0 ? `대기 금액 ${money(dashboard.orders.pendingAmount)} · 가격 후보 ${pendingWithPrice}건` : "새 발주 요청이 들어오면 여기서 검토합니다",
      value: dashboard.orders.pending.length > 0 ? countText(dashboard.orders.pending.length) : "정상",
      actionLabel: dashboard.orders.pending.length > 0 ? "승인 처리" : "승인 보기",
      color: dashboard.orders.pending.length > 0 ? T.orange500 : T.green500,
      iconBg: dashboard.orders.pending.length > 0 ? T.orange50 : T.green50,
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
      color: waitingTracking > 0 ? T.blue500 : T.green500,
      iconBg: waitingTracking > 0 ? T.blue50 : T.green50,
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
      color: T.green500,
      iconBg: T.green50,
      urgent: dashboard.orders.delivered.length > 0,
      onClick: () => setTab("shipping"),
    },
    {
      key: "inventory",
      Icon: PackageSearch,
      title: inventoryAttention > 0 ? `재고 확인 필요 ${inventoryAttention}개` : "재고 위험 신호 없음",
      sub: inventoryAttention > 0 ? (
        <>
          부족 <span style={{ color: T.red500, fontWeight: 900 }}>{lowInventoryCount}개</span> · 유통기한 <span style={{ color: T.orange500, fontWeight: 900 }}>{expirySoonCount}개</span>
        </>
      ) : `입고 대기 ${dashboard.inventory.incoming.length}개 · 부족/임박 품목 없음`,
      value: inventoryAttention > 0 ? countText(inventoryAttention, "개") : "정상",
      actionLabel: "재고 보기",
      color: inventoryAttention > 0 ? T.red500 : T.green500,
      iconBg: inventoryAttention > 0 ? T.red50 : T.green50,
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
          { label: "발주 승인", sub: countText(dashboard.orders.pending.length), Icon: ClipboardList, primary: true, color: dashboard.orders.pending.length > 0 ? T.orange500 : T.grey700, onClick: () => setTab("shipping") },
          { label: "재고 부족", sub: countText(lowInventoryCount, "개"), Icon: PackageSearch, color: lowInventoryCount > 0 ? T.red500 : T.grey700, onClick: () => setTab("inventory") },
          { label: "가격 후보", sub: countText(pendingWithPrice), Icon: TrendingDown, color: pendingWithPrice > 0 ? T.blue500 : T.grey700, onClick: () => setTab("shipping") },
          { label: "관리", sub: `${activeUsers}명`, Icon: Users, onClick: () => setTab("admin") },
        ]}
        quiet
      />
      <TodaySurgerySection {...props} title="수술 준비 상태" />
    </>
  );
}

function StaffHome(props) {
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
        title="재고 바로가기"
        actions={[
          { label: "재고 검색", sub: countText(dashboard.inventory.total, "개"), Icon: PackageSearch, onClick: () => setTab("inventory") },
          { label: "입출고 내역", sub: "오늘 기록 확인", Icon: Activity, onClick: () => setTab("inout") },
          { label: "입고 등록", sub: "수량 추가", Icon: ArrowDownToLine, primary: true, onClick: () => openModal?.("in") },
          { label: "출고 등록", sub: "사용량 기록", Icon: ArrowUpFromLine, onClick: () => openModal?.("out") },
        ]}
      />
      <StatsBar items={props.items} setTab={setTab} />
    </>
  );
}

export function HomeScreen({
  currentUser,
  users = [],
  items,
  txs,
  orders,
  surgeries,
  setTab,
  openModal,
  canApprove,
  confirmSurgeryPrep,
  confirmSurgeryUsage,
  openItemsEditor,
  updateSurgeryItems,
}) {
  const role = currentUser?.role || "staff";
  const dashboard = useMemo(() => buildHomeDashboard({ items, txs, orders, surgeries }), [items, orders, surgeries, txs]);
  const canManageSurgery = can(role, "surgery_manage");
  const canConfirmSurgery = can(role, "surgery_confirm");
  const canViewSurgery = can(role, "surgery_view_all") || can(role, "surgery_view_today") || canConfirmSurgery;

  const commonProps = {
    role,
    currentUser,
    users,
    dashboard,
    items,
    txs,
    orders,
    surgeries,
    setTab,
    openModal,
    canApprove,
    canManageSurgery,
    canConfirmSurgery,
    canViewSurgery,
    confirmSurgeryPrep,
    confirmSurgeryUsage,
    openItemsEditor,
    updateSurgeryItems,
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {can(role, "home_cost") ? (
        <OwnerHome {...commonProps} />
      ) : can(role, "home_operations") ? (
        <ManagerHome {...commonProps} />
      ) : (
        <StaffHome {...commonProps} />
      )}
    </div>
  );
}
