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

  const tasks = useMemo(() => {
    const list = [];

    // 주문 승인 대기 (관리자만)
    if (canApprove && approvalOrders.length > 0) {
      list.push({
        id: "approval",
        type: "approval",
        data: approvalOrders,
      });
    }

    // 배송 완료 (모든 사용자)
    if (shippingOrders.length > 0) {
      list.push({
        id: "shipping",
        type: "shipping",
        data: shippingOrders,
      });
    }

    return list;
  }, [canApprove, approvalOrders, shippingOrders]);

  if (tasks.length === 0) return null;

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
            {tasks.length}건
          </span>
        </div>
        {tasks.map((task, i) => (
          <div key={task.id}>
            {i > 0 && <Divider />}
            {task.type === "approval" && (
              <div>
                {task.data.map((order, idx) => {
                  const itemName =
                    items.find(it => it.id === order.item_id)?.name || "-";
                  const price =
                    items.find(it => it.id === order.item_id)?.price || 0;
                  return (
                    <div key={`approval-${order.id}`}>
                      {idx > 0 && <Divider />}
                      <button
                        onClick={() => setTab("admin")}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 16px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: font,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: T.orange50,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <ClipboardList size={20} color={T.orange500} />
                        </div>
                        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 600,
                              color: T.grey900,
                            }}
                          >
                            🔴 주문 승인 대기 {task.data.length}건
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 16,
                              color: T.grey500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {itemName} · {price.toLocaleString()}원
                          </p>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: "12px 18px",
                            borderRadius: 9999,
                            background: T.red500,
                            color: T.white,
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          주문 링크
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {task.type === "shipping" && (
              <div>
                {task.data.map((order, idx) => {
                  const itemName =
                    items.find(it => it.id === order.item_id)?.name || "-";
                  const carrier = order.carrier || "-";
                  const trackingNumber = order.tracking_number || "-";
                  return (
                    <div key={`shipping-${order.id}`}>
                      {idx > 0 && <Divider />}
                      <button
                        onClick={() => setTab("shipping")}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 16px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: font,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: T.teal50,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={20} color={T.teal500} />
                        </div>
                        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 600,
                              color: T.grey900,
                            }}
                          >
                            📦 배송 완료 {task.data.length}건
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 16,
                              color: T.grey500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {itemName} · {carrier}
                            {trackingNumber && trackingNumber !== "-" ? ` · ${trackingNumber}` : ""}
                          </p>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: "12px 18px",
                            borderRadius: 9999,
                            background: T.blue500,
                            color: T.white,
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          입고 확인
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
