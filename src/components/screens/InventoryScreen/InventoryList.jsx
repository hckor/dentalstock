import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";

function CompactListSection({ items, renderCompactItem }) {
  if (!items.length) return null;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.grey100}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 50px", gap: 8, padding: "8px 12px", background: T.grey50, borderBottom: `1px solid ${T.grey100}` }}>
        {["품목", "수량", "상태"].map(label => (
          <p key={label} style={{ margin: 0, fontSize: 11, lineHeight: "15px", fontWeight: 800, color: T.grey500, textAlign: label === "품목" ? "left" : "right" }}>
            {label}
          </p>
        ))}
      </div>
      {items.map((item, index) => renderCompactItem(item, index, items.length))}
    </div>
  );
}

function GridListSection({ items, renderGridItem }) {
  if (!items.length) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
      {items.map(item => renderGridItem(item))}
    </div>
  );
}

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
  renderCompactItem,
  renderGridItem,
}) {
  const [showNormalItems, setShowNormalItems] = useState(false);
  const hasFocusedFilter = cat !== 0 || risk !== "all" || search.trim();
  const shouldHideNormal = okItems.length > 0 && !hasFocusedFilter && !showNormalItems;
  const visibleOkItems = shouldHideNormal ? [] : okItems;
  const showBulkOrderAction = bulkableCount > 0 || blockedShortageCount > 0;
  const useGridLayout = !hasFocusedFilter;
  const ItemsSection = useGridLayout ? GridListSection : CompactListSection;
  const itemRendererProp = useGridLayout
    ? { renderGridItem }
    : { renderCompactItem };

  return (
    <div style={{ padding: "4px 16px 24px" }}>
      {alertItems.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: 9999, background: inventoryTone.expiry.color, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700, flex: 1 }}>확인 필요 {alertItems.length}</p>
            {showBulkOrderAction && (
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
                {bulkableCount ? `부족 ${bulkableCount}건 발주` : "발주 진행 중"}
              </button>
            )}
          </div>
          {blockedShortageCount > 0 && (
            <p style={{ margin: "-4px 0 10px", fontSize: 12, lineHeight: "17px", color: T.grey500 }}>
              발주 중 {blockedShortageCount}건 제외
            </p>
          )}
          <ItemsSection items={alertItems} {...itemRendererProp} />
        </>
      )}

      {alertItems.length === 0 && filteredItems.length > 0 && !hasFocusedFilter && (
        <div style={{ background: T.white, borderRadius: 12, padding: "16px 14px", marginBottom: 10, border: `1px solid ${T.grey100}` }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 800, color: T.grey800 }}>확인 필요한 재고 없음</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>정상 품목 {okItems.length}개</p>
        </div>
      )}

      {okItems.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, marginTop: alertItems.length ? 6 : 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: 9999, background: inventoryTone.ok.color }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700, flex: 1 }}>정상 {okItems.length}</p>
          {!hasFocusedFilter && (
            <button
              type="button"
              onClick={() => setShowNormalItems(prev => !prev)}
              style={{ border: `1px solid ${T.grey200}`, borderRadius: 9999, background: T.white, color: T.grey700, padding: "7px 11px", fontSize: 13, fontWeight: 800, fontFamily: font, cursor: "pointer" }}
            >
              {showNormalItems ? "접기" : "보기"}
            </button>
          )}
        </div>
      )}

      <ItemsSection items={visibleOkItems} {...itemRendererProp} />

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
