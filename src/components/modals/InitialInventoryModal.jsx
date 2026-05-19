import { useState } from "react";
import { X } from "lucide-react";
import { T, font } from "../../constants/colors";
import { Inp } from "../shared/Inp";

export function InitialInventoryModal({ items, onSave, onClose }) {
  const [quantities, setQuantities] = useState(
    items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
  );

  const handleQuantityChange = (itemId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, parseInt(value) || 0),
    }));
  };

  const handleSave = () => {
    onSave(quantities);
    onClose();
  };

  return (
    <div style={{ padding: "16px 20px 0" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.grey900 }}>초기 재고 설정</h2>
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
      </div>

      <p style={{ margin: "0 0 16px", fontSize: 16, color: T.grey600 }}>
        전체 품목의 초기 재고를 한 번에 입력해주세요
      </p>

      {/* 스크롤 가능한 품목 리스트 */}
      <div style={{ maxHeight: "50vh", overflowY: "auto", marginBottom: 20 }}>
        {items.map((item) => (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 16, fontWeight: 600, color: T.grey900, margin: 0 }}>
                {item.name}
              </label>
              <span style={{ fontSize: 16, color: T.grey500 }}>({item.unit})</span>
            </div>
            <Inp
              type="number"
              value={quantities[item.id]}
              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              placeholder="수량 입력"
              style={{
                fontSize: 16,
                padding: "14px 16px",
                height: "48px",
              }}
            />
          </div>
        ))}
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "16px 0",
          borderRadius: 9999,
          border: "none",
          background: T.blue500,
          color: T.white,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: font,
          marginBottom: 20,
        }}
      >
        저장
      </button>
    </div>
  );
}
