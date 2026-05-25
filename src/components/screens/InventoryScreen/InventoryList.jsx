import { ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";

export function InventoryList({
  alertItems,
  okItems,
  filteredItems,
  cat,
  risk,
  search,
  bulkableCount,
  blockedShortageCount,
  inventoryTone,
  onBulkOrderClick,
  renderItem,
}) {
  return (
    <div style={{ padding: "4px 16px 24px" }}>
      {alertItems.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: 9999, background: inventoryTone.expiry.color, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700, flex: 1 }}>확인 필요 {alertItems.length}</p>
            <button
              type="button"
              onClick={onBulkOrderClick}
              disabled={!bulkableCount}
              title={blockedShortageCount ? `${blockedShortageCount}건은 이미 발주 진행 중이라 제외됩니다` : undefined}
              style={{
                minHeight: 38,
                padding: "9px 13px",
                borderRadius: 9999,
                border: "none",
                background: bulkableCount ? T.primary : T.grey200,
                color: bulkableCount ? T.white : T.grey500,
                fontSize: 14,
                fontWeight: 700,
                cursor: bulkableCount ? "pointer" : "default",
                fontFamily: font,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <ShoppingCart size={16} />
              {bulkableCount ? `부족 ${bulkableCount}건 발주` : "부족 품목 발주 중"}
            </button>
          </div>
          {blockedShortageCount > 0 && (
            <p style={{ margin: "-4px 0 10px", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>
              이미 발주 중인 {blockedShortageCount}건은 중복 요청에서 제외됩니다.
            </p>
          )}
          {alertItems.map(renderItem)}
          {okItems.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: 9999, background: inventoryTone.ok.color }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700 }}>정상</p>
            </div>
          )}
        </>
      )}

      {okItems.map(renderItem)}

      {filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ margin: 0, fontSize: 16, color: T.grey400 }}>
            {cat !== 0 || risk !== "all" || search.trim()
              ? "조건에 맞는 재고가 없어요"
              : "품목이 없어요"}
          </p>
        </div>
      )}
    </div>
  );
}
