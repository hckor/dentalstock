import { CheckCircle2 } from "lucide-react";
import { T } from "../../../constants/colors";
import { Card } from "../../shared/Card";

export function ShippingWorkPriorityCard({ groups }) {
  const flatOrders = groups.flatMap(group => group.orders);
  const trackingNeeded = flatOrders.filter(order => !order.tracking_number).length;
  const receiptNeeded = flatOrders.filter(order => order.tracking_number).length;

  return (
    <Card style={{ padding: 14, background: T.grey50, boxShadow: "none", border: `1px solid ${T.grey200}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9999, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: "20px", fontWeight: 900, color: T.grey900 }}>
            먼저 처리할 배송 업무
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>
            송장 등록 {trackingNeeded}건 · 입고 확인 {receiptNeeded}건
          </p>
        </div>
      </div>
    </Card>
  );
}
