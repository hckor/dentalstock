import { memo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

// 배송사 + 송장번호 표시 컴포넌트
export const ShippingInfo = memo(function ShippingInfo({
  carrier,
  trackingNumber,
  showLink = true,
  onLinkClick,
}) {
  const { tokens: T } = useTheme();

  const displayText = carrier ? (trackingNumber ? `${carrier}` : `${carrier}`) : "-";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: T.grey600, fontWeight: 500 }}>
        {displayText}
      </span>
      {trackingNumber && (
        <>
          <span style={{ fontSize: 12, color: T.grey300 }}>·</span>
          {showLink ? (
            <button
              onClick={onLinkClick}
              style={{
                fontSize: 12,
                color: T.blue500,
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {trackingNumber}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: T.grey600, fontWeight: 500 }}>
              {trackingNumber}
            </span>
          )}
        </>
      )}
    </div>
  );
});
