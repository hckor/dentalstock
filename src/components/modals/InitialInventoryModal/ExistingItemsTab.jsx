import { T } from "../../../constants/colors";
import { Inp } from "../../shared/Inp";

export function ExistingItemsTab({ items, quantities, handleQuantityChange }) {
  return (
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
            onChange={(event) => handleQuantityChange(item.id, event.target.value)}
            placeholder="수량 입력"
            style={{ fontSize: 16, padding: "14px 16px", height: 48 }}
          />
        </div>
      ))}
    </div>
  );
}
