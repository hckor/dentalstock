import { Clock } from "lucide-react";
import { T, CS, monoFont } from "../../constants/colors";
import { getStatus, catName, daysUntil } from "../../utils/helpers";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

export function ItemCard({ item, isOrdered, ao, onCardClick }) {
  const st   = getStatus(item);
  const days = daysUntil(item.expiry);
  const isOk = st === "ok";

  return (
    <div
      style={{
        background: T.white,
        borderRadius: 12,
        boxShadow: CS,
        marginBottom: 12,
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={() => onCardClick?.(item)}
    >
      <div style={{ padding: "16px", minWidth: 0 }}>

        {/* 품목명 + 상태칩 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 9, height: 9, marginTop: 8, borderRadius: 9999, background: isOk ? T.green500 : T.red500, flexShrink: 0 }} />
          <p style={{
            margin: 0,
            fontSize: 20,
            lineHeight: "26px",
            fontWeight: 700,
            color: T.grey900,
            flex: 1,
            minWidth: 0,
            ...twoLineText,
          }}>
            {item.name}
          </p>
          {isOrdered && (
            <span style={{ flexShrink: 0, fontSize: 13, lineHeight: "20px", fontWeight: 700, color: T.blue500, background: T.blue50, padding: "3px 7px", borderRadius: 12 }}>
              입고대기
            </span>
          )}
          {!ao && !isOk && (
            <span style={{ flexShrink: 0, fontSize: 13, lineHeight: "20px", fontWeight: 700, color: T.red500, background: T.red50, padding: "3px 7px", borderRadius: 12 }}>
              발주필요
            </span>
          )}
        </div>

        {/* 카테고리 · 위치 */}
        <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: "18px", color: T.grey400, overflowWrap: "break-word", wordBreak: "keep-all" }}>
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
          <span style={{ flexShrink: 0, minWidth: 96, textAlign: "right", fontSize: 16, fontWeight: 700, color: T.grey900, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>
            {item.current_qty}
            <span style={{ fontSize: 12, fontWeight: 400, color: T.grey500, fontFamily: "inherit" }}>
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

    </div>
  );
}
