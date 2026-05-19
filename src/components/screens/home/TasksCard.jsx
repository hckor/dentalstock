import { useMemo } from "react";
import { ClipboardList, Package } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { font } from "../../../constants/colors";

export function TasksCard({
  canApprove,
  approvalOrders = [],
  shippingOrders = [],
  items,
  setTab,
}) {
  const { tokens: T } = useTheme();

  const workItems = useMemo(() => {
    const getItem = (order) => items.find(it => it.id === order.item_id);
    const approvals = canApprove ? approvalOrders.map(order => {
      const item = getItem(order);
      const priceLabel = item?.price ? `${item.price.toLocaleString()}원` : "가격 미등록";
      return {
        id: `approval-${order.id}`,
        Icon: ClipboardList,
        iconBg: T.orange50,
        iconColor: T.orange500,
        title: item?.name || "-",
        subtitle: `발주 승인 대기 · ${priceLabel}`,
        actionLabel: "검토하기",
        actionBg: T.red500,
      };
    }) : [];

    const shippings = shippingOrders.map(order => {
      const item = getItem(order);
      const carrier = order.carrier || "송장 미등록";
      const trackingNumber = order.tracking_number ? ` · ${order.tracking_number}` : "";
      return {
        id: `shipping-${order.id}`,
        Icon: Package,
        iconBg: T.teal50,
        iconColor: T.teal500,
        title: item?.name || "-",
        subtitle: `입고 대기 · ${carrier}${trackingNumber}`,
        actionLabel: "확인하기",
        actionBg: T.blue500,
      };
    });

    return [...approvals, ...shippings];
  }, [T, approvalOrders, canApprove, items, shippingOrders]);

  if (workItems.length === 0) return null;

  return (
    <div style={{ padding: "16px 16px 0" }}>
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px 10px",
          }}
        >
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700 }}>
            오늘 해야 할 일
          </p>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.blue500 }}>
            {workItems.length}건
          </span>
        </div>
        {workItems.map((task, i) => {
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
                    borderRadius: 10,
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
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.title}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 16, color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.subtitle}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    padding: "10px 14px",
                    borderRadius: 9999,
                    background: task.actionBg,
                    color: T.white,
                    fontSize: 14,
                    fontWeight: 700,
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
