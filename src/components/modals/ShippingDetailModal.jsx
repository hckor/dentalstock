import { X, Check, Circle } from "lucide-react";
import { T, font } from "../../constants/colors";

export function ShippingDetailModal({ order, item, onClose, openModal }) {
  if (!order || !item) return null;

  // 배송 타임라인 더미 데이터
  const shippingTimeline = order.shipping_timeline || [
    { status: "배달완료", timestamp: "05/19 14:32", location: "수령처에 도착", completed: true },
    { status: "배송중", timestamp: "05/19 08:15", location: "서울 배송센터", completed: true },
    { status: "집하완료", timestamp: "05/18 23:41", location: "출발지 창고", completed: false },
    { status: "주문접수", timestamp: "05/18 15:00", location: "덴올", completed: false },
  ];

  return (
    <div style={{ padding: "16px 20px 0" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} color={T.grey500} />
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.grey900 }}>
            {item.name} 배송 추적
          </h2>
        </div>
      </div>

      {/* 배송사 정보 */}
      <div style={{ background: T.grey50, borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: `1px solid ${T.grey200}` }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.grey600, marginBottom: 4 }}>
          {order.shipping_company || "CJ대한통운"}
        </p>
        <p style={{ margin: 0, fontSize: 19, fontWeight: 700, color: T.grey900, fontFamily: "monospace" }}>
          {order.tracking_number || "1234567890"}
        </p>
      </div>

      {/* 타임라인 */}
      <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600, color: T.grey700 }}>배송 현황</p>

      <div style={{ marginBottom: 20 }}>
        {shippingTimeline.map((event, idx) => (
          <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
            {/* 아이콘 */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: event.completed ? T.green500 : T.grey300,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {event.completed ? (
                <Check size={18} color={T.white} />
              ) : (
                <Circle size={16} color={T.white} fill={T.white} />
              )}
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: T.grey900 }}>{event.status}</span>
                <span style={{ fontSize: 16, color: T.grey500 }}>— {event.timestamp}</span>
              </div>
              <p style={{ margin: 0, fontSize: 16, color: T.grey600 }}>📍 {event.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: T.grey200, marginBottom: 20 }} />

      {/* 주문 정보 */}
      <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600, color: T.grey700 }}>주문정보</p>

      <div style={{ background: T.teal50, borderRadius: 12, padding: "16px 18px", marginBottom: 20, border: `1px solid ${T.teal500}33` }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18, color: T.grey600 }}>덴올</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.teal500 }}>{order.qty}{item.unit}</span>
          <span style={{ fontSize: 18, color: T.grey600 }}>·</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.grey900 }}>{order.price?.toLocaleString()}원</span>
        </div>
        <p style={{ margin: "8px 0", fontSize: 16, color: T.grey600 }}>주문번호 {order.id}</p>
        <p style={{ margin: "4px 0", fontSize: 16, color: T.grey600 }}>요청자 {order.requested_by}</p>
      </div>

      {/* 입고 확인 버튼 */}
      <button
        onClick={() => openModal("confirm_receipt", { order, item })}
        style={{
          width: "100%",
          padding: "16px 0",
          borderRadius: 9999,
          border: "none",
          background: T.blue500,
          color: T.white,
          fontSize: 19,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: font,
          marginBottom: 20,
        }}
      >
        입고 확인 완료
      </button>
    </div>
  );
}
