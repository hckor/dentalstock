import { memo } from "react";
import { CheckCircle2, ChevronRight, FileText, Navigation, XCircle } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { Card } from "./Card";
import { Chip } from "./Chip";

export const ShippingOrderCard = memo(function ShippingOrderCard({ order, item, stage, canApprove, onActionClick }) {
  const os = ORDER_ST[order.status];

  if (!item) return null;

  const renderStageContent = () => {
    switch (stage) {
      case "auto_wait": {
        // 승인대기: 관리자 승인/반려, 요청자는 대기 상태 확인
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    <span style={{ fontWeight: 600, color: T.grey700 }}>수량:</span> {order.qty}{item.unit}
                    {order.requested_by && ` · 요청자: ${order.requested_by}`}
                  </p>
                  {order.note && <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>메모: {order.note}</p>}
                </div>
                <Chip label={os.label} color={os.text} bg={os.bg} />
              </div>

              {canApprove ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onActionClick("reject")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 9999,
                      border: `1.5px solid ${T.red500}55`,
                      background: T.white,
                      cursor: "pointer",
                      fontFamily: font,
                      fontSize: 16,
                      fontWeight: 600,
                      color: T.red500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <XCircle size={18} />
                    반려
                  </button>
                  <button
                    onClick={() => onActionClick("approve")}
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
                    }}
                  >
                    <CheckCircle2 size={18} />
                    승인
                  </button>
                </div>
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 }}>
                  관리자 검토를 기다리는 중입니다
                </div>
              )}
            </div>
          </>
        );
      }

      case "in_transit": {
        // 진행중: 송장 등록/상세 + 입고 확인
        const hasTracking = !!order.tracking_number;
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    <span style={{ fontWeight: 600, color: T.teal500 }}>{hasTracking ? "배송 추적 중" : "송장 미등록"}</span>
                    {order.carrier && ` · ${order.carrier}`}
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

              <div style={{ display: "flex", gap: 8 }}>
                {(hasTracking || canApprove) && (
                  <button
                    onClick={() => onActionClick(hasTracking ? "tracking_detail" : "tracking_start")}
                    style={{
                      flex: 1,
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
                    }}
                  >
                    {hasTracking ? <FileText size={18} /> : <Navigation size={18} />}
                    {hasTracking ? "송장 상세" : "송장 등록"}
                    {hasTracking && <ChevronRight size={18} style={{ marginLeft: "auto" }} />}
                  </button>
                )}
                {canApprove && (
                  <button
                    onClick={() => onActionClick("confirm_receipt")}
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
                    }}
                  >
                    <CheckCircle2 size={18} />
                    입고 확인
                  </button>
                )}
              </div>
              {!hasTracking && !canApprove && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: T.grey50, color: T.grey600, fontSize: 16, fontWeight: 600 }}>
                  송장 등록을 기다리는 중입니다
                </div>
              )}
            </div>
          </>
        );
      }

      case "rejected": {
        return (
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>{item.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                  수량 <span style={{ fontWeight: 600, color: T.grey700 }}>{order.qty}{item.unit}</span>
                  {order.review_note && ` · ${order.review_note}`}
                </p>
              </div>
              <Chip label={os.label} color={os.text} bg={os.bg} />
            </div>
          </div>
        );
      }

      case "completed": {
        // 완료: 입고 처리 완료된 주문 이력 표시
        return (
          <>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                    수량 <span style={{ fontWeight: 600, color: T.grey700 }}>{order.qty}{item.unit}</span>
                    {order.requested_by && ` · 요청자: ${order.requested_by}`}
                  </p>
                  {order.reviewed_by && (
                    <p style={{ margin: "4px 0 0", fontSize: 16, color: T.grey500 }}>
                      <span style={{ fontWeight: 600, color: T.green500 }}>✓ 입고 완료</span>
                      {` · ${order.reviewed_by}`}
                    </p>
                  )}
                </div>
                <Chip label={os.label} color={os.text} bg={os.bg} />
              </div>
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
