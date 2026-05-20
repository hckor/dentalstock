import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronRight, ClipboardList, Package, PackageCheck, Truck } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { font, monoFont } from "../../../constants/colors";
import { todayKey } from "../../../utils/helpers";
import { getShippingEvents } from "../../../utils/shippingEvents";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

const oneLineText = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function TasksCard({
  canApprove,
  approvalOrders = [],
  shippingOrders = [],
  surgeries = [],
  items,
  setTab,
  defaultExpanded = false,
}) {
  const { tokens: T } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const workItems = useMemo(() => {
    const getItem = (order) => items.find(it => it.id === order.item_id);
    const itemMap = new Map(items.map(item => [item.id, item]));
    const approvals = canApprove ? approvalOrders.map(order => {
      const item = getItem(order);
      const priceLabel = item?.price ? `${item.price.toLocaleString()}원` : "가격 미등록";
      return {
        id: `approval-${order.id}`,
        kind: "approval",
        priority: 10,
        Icon: ClipboardList,
        iconBg: T.orange50,
        iconColor: T.orange500,
        title: item?.name || "-",
        subtitle: `발주 승인 대기 · ${priceLabel}`,
        actionLabel: "검토하기",
        actionBg: T.blue500,
      };
    }) : [];

    const shippings = shippingOrders.map(order => {
      const item = getItem(order);
      const latestShippingEvent = getShippingEvents(order)[0];
      const isDelivered = latestShippingEvent?.status === "배달완료";
      const needsTracking = !order.tracking_number && canApprove;
      const carrier = order.carrier || "송장 미등록";
      const trackingNumber = order.tracking_number ? ` · ${order.tracking_number}` : "";
      return {
        id: `${isDelivered ? "receipt" : needsTracking ? "tracking" : "shipping"}-${order.id}`,
        kind: isDelivered ? "receipt" : needsTracking ? "tracking" : "shipping",
        priority: isDelivered ? 20 : needsTracking ? 30 : 60,
        Icon: isDelivered ? PackageCheck : needsTracking ? Truck : Package,
        iconBg: isDelivered ? T.green50 : needsTracking ? T.blue50 : T.teal50,
        iconColor: isDelivered ? T.green500 : needsTracking ? T.blue500 : T.teal500,
        title: item?.name || "-",
        subtitle: isDelivered ? `배송완료 · 입고 수량 확인 필요` : needsTracking ? `송장 미등록 · ${carrier}` : `입고 대기 · ${carrier}${trackingNumber}`,
        actionLabel: isDelivered ? "입고확인" : needsTracking ? "송장등록" : "확인하기",
        actionBg: T.blue500,
      };
    });

    const today = todayKey();
    const surgeryTasks = surgeries
      .filter(surgery => surgery.scheduled_date === today && (!surgery.prep_confirmed || (surgery.prep_confirmed && !surgery.usage_confirmed)))
      .map(surgery => {
        if (surgery.prep_confirmed && !surgery.usage_confirmed) {
          return {
            id: `surgery-usage-${surgery.id}`,
            kind: "surgery_usage",
            priority: 35,
            Icon: ClipboardList,
            iconBg: T.blue50,
            iconColor: T.blue500,
            title: surgery.title,
            subtitle: "수술 후 실사용량 확인 필요",
            actionLabel: "확인하기",
            actionBg: T.blue500,
          };
        }
        const shortageCount = (surgery.required_items || []).filter(required => {
          const item = itemMap.get(required.item_id);
          return item && item.current_qty < required.qty;
        }).length;
        if (!shortageCount) return null;
        return {
          id: `surgery-${surgery.id}`,
          kind: "surgery",
          priority: 40,
          Icon: CalendarClock,
          iconBg: T.orange50,
          iconColor: T.orange500,
          title: surgery.title,
          subtitle: `수술 준비 부족 · ${shortageCount}개 품목 확인`,
          actionLabel: "준비하기",
          actionBg: T.blue500,
        };
      })
      .filter(Boolean);

    const now = new Date(`${today}T00:00:00`);
    const expiryTasks = items
      .filter(item => item.expiry)
      .map(item => {
        const expiryDate = new Date(`${item.expiry}T00:00:00`);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);
        return { item, daysLeft };
      })
      .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3)
      .map(({ item, daysLeft }) => ({
        id: `expiry-${item.id}`,
        kind: "expiry",
        priority: 50,
        Icon: AlertTriangle,
        iconBg: T.red50,
        iconColor: T.red500,
        title: item.name,
        subtitle: `유통기한 ${daysLeft}일 남음 · ${item.expiry}`,
        actionLabel: "확인하기",
        actionBg: T.blue500,
      }));

    return [...approvals, ...shippings, ...surgeryTasks, ...expiryTasks].sort((a, b) => (a.priority || 70) - (b.priority || 70));
  }, [T, approvalOrders, canApprove, items, shippingOrders, surgeries]);

  if (workItems.length === 0) return null;

  const approvalCount = canApprove ? approvalOrders.length : 0;
  const receiptCount = workItems.filter(item => item.kind === "receipt").length;
  const trackingCount = workItems.filter(item => item.kind === "tracking").length;
  const shippingCount = workItems.filter(item => item.kind === "shipping").length;
  const surgeryCount = workItems.filter(item => item.kind === "surgery").length;
  const surgeryUsageCount = workItems.filter(item => item.kind === "surgery_usage").length;
  const expiryCount = workItems.filter(item => item.kind === "expiry").length;
  const firstApproval = workItems.find(item => item.kind === "approval");
  const firstReceipt = workItems.find(item => item.kind === "receipt");
  const firstTracking = workItems.find(item => item.kind === "tracking");
  const firstShipping = workItems.find(item => item.kind === "shipping");
  const firstSurgery = workItems.find(item => item.kind === "surgery");
  const firstSurgeryUsage = workItems.find(item => item.kind === "surgery_usage");
  const firstExpiry = workItems.find(item => item.kind === "expiry");
  const summaryItems = [
    approvalCount > 0 && { key: "approval", count: approvalCount, label: "승인 대기", subtitle: `${firstApproval?.title || "-"}부터 검토`, Icon: ClipboardList, bg: T.orange50, color: T.orange500 },
    receiptCount > 0 && { key: "receipt", count: receiptCount, label: "입고 확인", subtitle: `${firstReceipt?.title || "-"} 수량 확인`, Icon: PackageCheck, bg: T.green50, color: T.green500 },
    trackingCount > 0 && { key: "tracking", count: trackingCount, label: "송장 등록", subtitle: `${firstTracking?.title || "-"}부터 등록`, Icon: Truck, bg: T.blue50, color: T.blue500 },
    surgeryUsageCount > 0 && { key: "surgery_usage", count: surgeryUsageCount, label: "사용량 확인", subtitle: `${firstSurgeryUsage?.title || "-"} 확인`, Icon: ClipboardList, bg: T.blue50, color: T.blue500 },
    surgeryCount > 0 && { key: "surgery", count: surgeryCount, label: "수술 준비", subtitle: `${firstSurgery?.title || "-"} 확인`, Icon: CalendarClock, bg: T.orange50, color: T.orange500 },
    expiryCount > 0 && { key: "expiry", count: expiryCount, label: "유통기한", subtitle: `${firstExpiry?.title || "-"} 확인`, Icon: AlertTriangle, bg: T.red50, color: T.red500 },
    shippingCount > 0 && { key: "shipping", count: shippingCount, label: "입고 대기", subtitle: `${firstShipping?.title || "-"}부터 확인`, Icon: Package, bg: T.teal50, color: T.teal500 },
  ].filter(Boolean).slice(0, 3);

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px 10px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontFamily: font,
          }}
        >
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.grey800 }}>
            오늘 해야 할 일
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.blue500, fontFamily: monoFont }}>
              {workItems.length}건
            </span>
            <ChevronRight size={18} color={T.grey400} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
          </div>
        </button>

        {!expanded && (
          <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {summaryItems.map(summary => {
              const Icon = summary.Icon;
              return (
              <button
                key={summary.key}
                type="button"
                onClick={() => setExpanded(true)}
                style={{ width: "100%", border: "none", background: summary.bg, borderRadius: 12, padding: "12px 14px", fontFamily: font, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <Icon size={20} color={summary.color} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.grey900, ...oneLineText }}>
                    {summary.label} {summary.count}건
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 14, color: T.grey600, ...oneLineText }}>
                    {summary.subtitle}
                  </p>
                </div>
              </button>
              );
            })}
          </div>
        )}

        {expanded && workItems.map((task, i) => {
          const Icon = task.Icon;
          return (
            <div key={task.id}>
              {i > 0 && <Divider />}
              <button
                onClick={() => setTab("shipping")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: font,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: task.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={task.iconColor} />
                </div>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 600, color: T.grey900, ...twoLineText }}>
                    {task.title}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 16, lineHeight: "22px", color: T.grey500, ...twoLineText }}>
                    {task.subtitle}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    minWidth: 86,
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    borderRadius: 9999,
                    background: task.actionBg,
                    color: T.white,
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: "20px",
                    textAlign: "center",
                  }}
                >
                  {task.actionLabel}
                </span>
              </button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
