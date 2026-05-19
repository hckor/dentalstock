import { Clock, ChevronRight } from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { getStatus, catName, daysUntil } from "../../utils/helpers";

export function ItemCard({
  item,
  isOrdered,
  ao,
  onCardClick,
  onOutClick,
  openModal
}) {
  const st = getStatus(item);
  const days = daysUntil(item.expiry);
  const recQty = item.min_qty * 2;

  const handleCardClick = () => {
    onCardClick && onCardClick(item);
  };

  const handleOutClick = (e) => {
    e.stopPropagation();
    onOutClick && onOutClick(item);
  };

  return (
    <div
      key={item.id}
      style={{
        background: T.white,
        borderRadius: 16,
        boxShadow: CS,
        marginBottom: 10,
        overflow: "hidden",
        cursor: "pointer"
      }}
      onClick={handleCardClick}
    >
      {/* 메인 영역 */}
      <div style={{ padding: "16px 16px 14px" }}>
        {/* 헤더: 점 + 품목명 + 상태칩 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 9999,
              background: st === "ok" ? T.green500 : T.red500,
              flexShrink: 0,
              marginTop: 4
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: T.grey900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {item.name}
              </p>
              {isOrdered && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.blue500,
                    background: "#dbeafe",
                    padding: "2px 9px",
                    borderRadius: 9999
                  }}
                >
                  입고대기
                </span>
              )}
              {!ao && st !== "ok" && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: T.red500,
                    background: T.red50,
                    padding: "2px 9px",
                    borderRadius: 9999
                  }}
                >
                  발주 필요
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 18, color: T.grey400 }}>
              {catName(item.category_id)} · {item.location}
            </p>
          </div>
        </div>

        {/* 재고 바 + 수량 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              flex: 1,
              height: 5,
              background: "#f1f5f9",
              borderRadius: 9999,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 9999,
                background: st === "ok" ? T.green500 : T.red500,
                width: `${Math.min(100, (item.current_qty / Math.max(recQty, 1)) * 100)}%`,
                transition: "width 300ms"
              }}
            />
          </div>
          <span
            style={{
              flexShrink: 0,
              fontSize: 20,
              fontWeight: 700,
              color: T.grey800,
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {item.current_qty}
            <span style={{ fontSize: 18, fontWeight: 400, color: T.grey400 }}>
              {" "}/ {recQty}
              {item.unit}
            </span>
          </span>
        </div>

        {/* 유통기한 경고 */}
        {days !== null && days <= 30 && (
          <div
            style={{
              background: days <= 7 ? T.red50 : T.orange50,
              borderRadius: 10,
              padding: "12px 16px",
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Clock size={16} color={days <= 7 ? T.red500 : T.orange500} />
            <span
              style={{
                fontSize: 18,
                color: days <= 7 ? T.red500 : T.orange500,
                fontWeight: 600
              }}
            >
              유통기한 {days <= 0 ? "만료" : `${days}일 후 만료`} ({item.expiry})
            </span>
          </div>
        )}

        {/* 배송 도착 배너 */}
        {isOrdered && (
          <div
            style={{
              background: "#f0f4ff",
              borderRadius: 12,
              padding: "16px 18px",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.grey900 }}>
                배송 도착
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 18, color: T.grey500 }}>
                {ao.qty}
                {item.unit} · 요청자 {ao.requested_by}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal("confirm_receipt", item);
              }}
              style={{
                flexShrink: 0,
                padding: "10px 18px",
                borderRadius: 9999,
                border: "none",
                background: T.blue500,
                color: T.white,
                fontSize: 19,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: font,
                display: "flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
                minHeight: 44,
                minWidth: 44
              }}
            >
              입고 확인 <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* 재고 부족 배너 */}
        {!ao && st !== "ok" && (
          <div
            style={{
              background: "#fff5f5",
              borderRadius: 12,
              padding: "16px 18px",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.grey900 }}>
                발주 필요
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 18, color: T.grey500 }}>
                추천 {recQty}
                {item.unit} · 최근 30일 평균 기준
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal("order_req", item);
              }}
              style={{
                flexShrink: 0,
                padding: "10px 18px",
                borderRadius: 9999,
                border: "none",
                background: T.red500,
                color: T.white,
                fontSize: 19,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: font,
                display: "flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
                minHeight: 44,
                minWidth: 44
              }}
            >
              발주 <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 하단 버튼 — [출고-] ONLY */}
      <div style={{ borderTop: `1px solid #f1f5f9`, padding: "10px 12px 12px", display: "flex" }}>
        <button
          onClick={handleOutClick}
          style={{
            flex: 1,
            padding: "16px 0",
            borderRadius: 10,
            border: "none",
            background: "#fff0f0",
            color: T.red500,
            fontSize: 19,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: font,
            minHeight: 44
          }}
        >
          출고
        </button>
      </div>
    </div>
  );
}
