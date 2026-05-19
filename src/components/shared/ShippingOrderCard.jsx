import { memo } from "react";
import { ChevronRight, Link as LinkIcon, Navigation, FileText, CheckCircle2 } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Divider } from "./Divider";

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, onActionClick }) {
  const os = ORDER_ST[order.status];

  if (!item) return null;

  const renderStageContent = () => {
    switch (stage) {
      case "auto_wait": {
        // 자동대기: 가격 정보 + [주문 링크] + [추적 시작]
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    <span style={{ fontWeight: 600, color: T.grey700 }}>수량:</span> {order.qty}
                    {item.unit}
                  </p>
                </div>
                <Chip label={os.label} color={os.text} bg={os.bg} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onActionClick("order_link")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 9999,
                    border: `1.5px solid ${T.blue500}`,
                    background: T.white,
                    cursor: "pointer",
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.blue500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = T.blue50)}
                  onMouseLeave={(e) => (e.target.style.background = T.white)}
                >
                  <LinkIcon size={18} />
                  주문 링크
                </button>
                <button
                  onClick={() => onActionClick("tracking_start")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 9999,
                    border: "none",
                    background: T.blue500,
                    cursor: "pointer",
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = T.blue600)}
                  onMouseLeave={(e) => (e.target.style.background = T.blue500)}
                >
                  <Navigation size={18} />
                  추적 시작
                </button>
              </div>
            </div>
          </>
        );
      }

      case "in_transit": {
        // 진행중: 배송사 + 송장번호 + [송장 상세]
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    <span style={{ fontWeight: 600, color: T.teal500 }}>배송 중</span>
                    {order.shipping_company && ` · ${order.shipping_company}`}
                  </p>
                  {order.tracking_number && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 16,
                        color: T.grey600,
                        fontFamily: "monospace",
                        fontWeight: 500,
                      }}
                    >
                      송장: {order.tracking_number}
                    </p>
                  )}
                </div>
                <Chip label={os.label} color={os.text} bg={os.bg} />
              </div>

              <button
                onClick={() => onActionClick("tracking_detail")}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 9999,
                  border: `1.5px solid ${T.grey300}`,
                  background: T.white,
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: 16,
                  fontWeight: 600,
                  color: T.grey700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = T.grey50;
                  e.target.style.borderColor = T.grey400;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = T.white;
                  e.target.style.borderColor = T.grey300;
                }}
              >
                <FileText size={18} />
                송장 상세
                <ChevronRight size={18} style={{ marginLeft: "auto" }} />
              </button>
            </div>
          </>
        );
      }

      case "completed": {
        // 완료: 배달 완료 시간 + [입고 확인]
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    <span style={{ fontWeight: 600, color: T.green500 }}>배달 완료</span>
                    {order.received_at && ` · ${new Date(order.received_at).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
                <Chip label={os.label} color={os.text} bg={os.bg} />
              </div>

              <button
                onClick={() => onActionClick("confirm_receipt")}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 9999,
                  border: "none",
                  background: T.green500,
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: 16,
                  fontWeight: 600,
                  color: T.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.target.style.opacity = 1)}
              >
                <CheckCircle2 size={18} />
                입고 확인
              </button>
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  return <Card style={{ overflow: "hidden" }}>{renderStageContent()}</Card>;
});
