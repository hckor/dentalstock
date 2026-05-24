import { Package } from "lucide-react";
import { T } from "../../../constants/colors";
import { Card } from "../../shared/Card";

const EMPTY_TEXT = {
  auto_wait: {
    title: "승인 대기 중인 주문이 없어요",
    approveSub: "요청을 승인하거나 반려할 수 있습니다",
    staffSub: "관리자 검토를 기다리는 요청입니다",
  },
  in_transit: {
    title: "진행 중인 주문이 없어요",
    sub: "송장 등록과 입고 확인을 진행하세요",
  },
  completed: {
    title: "입고 완료된 주문이 없어요",
    sub: "입고 확인을 완료한 주문들입니다",
  },
  hold: {
    title: "보류 중인 주문이 없어요",
    sub: "원장 확인이나 가격 확인이 필요한 요청입니다",
  },
  rejected: {
    title: "반려된 주문이 없어요",
    sub: "반려된 발주 요청입니다",
  },
};

export function ShippingTrackingEmptyState({ trackingTab, canApprove }) {
  const copy = EMPTY_TEXT[trackingTab] || EMPTY_TEXT.auto_wait;
  const sub = trackingTab === "auto_wait"
    ? canApprove ? copy.approveSub : copy.staffSub
    : copy.sub;

  return (
    <Card style={{ padding: "40px 20px", textAlign: "center" }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 9999,
          background: T.grey100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <Package size={28} color={T.grey400} />
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: T.grey700 }}>
        {copy.title}
      </p>
      <p style={{ margin: 0, fontSize: 16, color: T.grey500 }}>
        {sub}
      </p>
    </Card>
  );
}
