import { useState } from "react";
import { X, ChevronDown, ChevronUp, Package, MapPin, Calendar } from "lucide-react";
import { T, font } from "../../constants/colors";

export function ItemDetailModal({ item, onClose, openModal, showToast }) {
  const [isManageOpen, setIsManageOpen] = useState(false);

  if (!item) return null;

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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.grey900 }}>{item.name}</h2>
        </div>
      </div>

      {/* 재고 정보 카드 */}
      <div style={{ background: T.grey50, borderRadius: 12, padding: "16px 18px", marginBottom: 20, border: `1px solid ${T.grey200}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Package size={20} color={T.blue500} />
          <span style={{ fontSize: 16, fontWeight: 600, color: T.grey700 }}>현재 재고</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.blue500 }}>
            {item.current_qty}{item.unit}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Package size={20} color={T.orange500} />
          <span style={{ fontSize: 16, fontWeight: 600, color: T.grey700 }}>최소 재고</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.orange500 }}>
            {item.min_qty}{item.unit}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MapPin size={20} color={T.grey600} />
          <span style={{ fontSize: 16, fontWeight: 600, color: T.grey700 }}>위치</span>
          <span style={{ fontSize: 16, color: T.grey800 }}>{item.location || "미지정"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={20} color={T.grey600} />
          <span style={{ fontSize: 16, fontWeight: 600, color: T.grey700 }}>유통기한</span>
          <span style={{ fontSize: 16, color: T.grey800 }}>{item.expiry_date || "—"}</span>
        </div>
      </div>

      {/* 출고 처리 버튼 */}
      <button
        onClick={() => openModal("in_out", { item, type: "out" })}
        style={{
          width: "100%",
          padding: "18px 0",
          borderRadius: 9999,
          border: "none",
          background: T.red500,
          color: T.white,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: font,
          marginBottom: 20,
        }}
      >
        출고 처리
      </button>

      {/* 관리 기능 아코디언 */}
      <div style={{ borderTop: `1px solid ${T.grey200}`, paddingTop: 16 }}>
        <button
          onClick={() => setIsManageOpen(!isManageOpen)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
            color: T.grey700,
            fontFamily: font,
          }}
        >
          <span>관리 기능</span>
          {isManageOpen ? <ChevronUp size={20} color={T.grey500} /> : <ChevronDown size={20} color={T.grey500} />}
        </button>

        {isManageOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
            <button
              onClick={() => openModal("in_out", { item, type: "in" })}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 9999,
                border: `1.5px solid ${T.blue500}`,
                background: "transparent",
                color: T.blue500,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              수동 입고
            </button>
            <button
              onClick={() => openModal("adjust_inventory", { item })}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 9999,
                border: `1.5px solid ${T.grey300}`,
                background: "transparent",
                color: T.grey700,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              재고 조정
            </button>
            <button
              onClick={() => openModal("vendor_link", { item })}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 9999,
                border: `1.5px solid ${T.grey300}`,
                background: "transparent",
                color: T.grey700,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              도매 사이트 바로가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
