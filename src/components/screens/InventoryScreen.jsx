import { useMemo } from "react";
import { Search, CalendarClock, ShoppingCart } from "lucide-react";
import { T, font } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { getStatus, getActiveOrder } from "../../utils/helpers";
import { ItemCard } from "../shared/ItemCard";

const ALL_CATS = [{ id: 0, name: "전체", color: T.grey700 }, ...CATEGORIES];

export function InventoryScreen({ items, search, setSearch, cat, setCat, orders, onItemClick, onExpiryClick, onBulkOrderClick }) {
  const alertItems = useMemo(() => items.filter(i => getStatus(i) !== "ok"), [items]);
  const okItems    = useMemo(() => items.filter(i => getStatus(i) === "ok"),  [items]);
  const bulkableCount = useMemo(
    () => alertItems.filter(item => !getActiveOrder(orders, item.id)).length,
    [alertItems, orders]
  );

  const renderItem = (item) => {
    const ao = getActiveOrder(orders, item.id);
    return (
      <ItemCard
        key={item.id}
        item={item}
        isOrdered={ao?.status === "ordered"}
        ao={ao}
        onCardClick={onItemClick}
      />
    );
  };

  return (
    <div>
      {/* 검색 + 유통기한 */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
              <Search size={18} color={T.grey400} />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="품목명 검색"
              style={{ width: "100%", height: 44, padding: "10px 16px 10px 40px", borderRadius: 12, border: `1px solid rgba(2,32,71,0.05)`, background: "rgba(0,23,51,0.02)", fontSize: 16, color: T.grey800, fontFamily: font, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={onExpiryClick}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 44, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.grey200}`, background: T.white, color: T.grey700, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}
          >
            <CalendarClock size={18} color={T.grey600} /> 유통기한
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
          {ALL_CATS.map(c => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  flexShrink: 0,
                  padding: "7px 14px",
                  borderRadius: 12,
                  border: active ? "none" : `1px solid ${T.grey200}`,
                  background: active ? T.blue500 : T.white,
                  color: active ? T.white : T.grey600,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 120ms",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "4px 16px 24px" }}>
        {/* 확인 필요 섹션 */}
        {alertItems.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: 9999, background: T.red500, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700, flex: 1 }}>확인 필요 {alertItems.length}</p>
              <button
                type="button"
                onClick={onBulkOrderClick}
                disabled={!bulkableCount}
                style={{
                  minHeight: 38,
                  padding: "9px 13px",
                  borderRadius: 9999,
                  border: "none",
                  background: bulkableCount ? T.blue500 : T.grey200,
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
                부족 품목 발주
              </button>
            </div>
            {alertItems.map(renderItem)}
            {okItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: 9999, background: T.green500 }} />
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey700 }}>정상</p>
              </div>
            )}
          </>
        )}

        {/* 정상 품목 */}
        {okItems.map(renderItem)}

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ margin: 0, fontSize: 16, color: T.grey400 }}>
              {cat !== 0 ? `${ALL_CATS.find(c => c.id === cat)?.name} 품목이 없어요` : "품목이 없어요"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
