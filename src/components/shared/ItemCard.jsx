import { Clock } from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { getStatus, catName, daysUntil } from "../../utils/helpers";

export function ItemCard({ item, isOrdered, ao, onCardClick, onOutClick }) {
  const st   = getStatus(item);
  const days = daysUntil(item.expiry);
  const isOk = st === "ok";

  const borderColor = isOk ? T.green500 : T.red500;

  return (
    <div
      style={{
        background: T.white,
        borderRadius: 16,
        boxShadow: CS,
        marginBottom: 16,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        borderLeft: `4px solid ${borderColor}`,
      }}
      onClick={() => onCardClick?.(item)}
    >
      {/* 메인 영역 */}
      <div style={{ flex: 1, padding: "16px 16px 14px", minWidth: 0 }}>

        {/* 품목명 + 상태칩 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: T.grey900,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}>
            {item.name}
          </p>
          {isOrdered && (
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.blue500, background: "#dbeafe", padding: "2px 8px", borderRadius: 9999 }}>
              입고대기
            </span>
          )}
          {!ao && !isOk && (
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.red500, background: T.red50, padding: "2px 8px", borderRadius: 9999 }}>
              발주필요
            </span>
          )}
        </div>

        {/* 카테고리 · 위치 */}
        <p style={{ margin: "0 0 12px", fontSize: 12, color: T.grey400 }}>
          {catName(item.category_id)} · {item.location}
        </p>

        {/* 프로그레스 바 — 기준: min_qty */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: T.grey100, borderRadius: 9999, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: 9999,
              background: isOk ? T.green500 : T.red500,
              width: `${Math.min(100, (item.current_qty / Math.max(item.min_qty, 1)) * 100)}%`,
              transition: "width 300ms",
            }} />
          </div>
          <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 700, color: T.grey800, fontVariantNumeric: "tabular-nums" }}>
            {item.current_qty}
            <span style={{ fontSize: 12, fontWeight: 400, color: T.grey400 }}>
              {item.unit} / 최소 {item.min_qty}
            </span>
          </span>
        </div>

        {/* 유통기한 경고 */}
        {days !== null && days <= 30 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: days <= 7 ? T.red50 : T.orange50,
            borderRadius: 8, padding: "8px 12px", marginTop: 10,
          }}>
            <Clock size={14} color={days <= 7 ? T.red500 : T.orange500} />
            <span style={{ fontSize: 12, color: days <= 7 ? T.red500 : T.orange500, fontWeight: 600 }}>
              유통기한 {days <= 0 ? "만료" : `${days}일 후`} ({item.expiry})
            </span>
          </div>
        )}
      </div>

      {/* 출고 버튼 — 우측 세로 배치 */}
      <button
        onClick={(e) => { e.stopPropagation(); onOutClick?.(item); }}
        style={{
          flexShrink: 0,
          width: 52,
          background: "#fff0f0",
          border: "none",
          borderLeft: `1px solid ${T.grey100}`,
          cursor: "pointer",
          fontFamily: font,
          fontSize: 12,
          fontWeight: 700,
          color: T.red500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        출고
      </button>
    </div>
  );
}
