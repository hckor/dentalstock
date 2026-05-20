import { memo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

// 배송 상태, 주문 승인 상태 등 통일된 상태 카드
export const StatusCard = memo(function StatusCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  actionLabel,
  actionBgColor,
  onClick,
}) {
  const { tokens: T } = useTheme();

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: `"Toss Product Sans","Tossface","SF Pro KR","SF Pro Display",-apple-system,BlinkMacSystemFont,"Basier Square","Apple SD Gothic Neo",Roboto,"Noto Sans KR",sans-serif`,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: iconBgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={20} color={iconColor} />}
      </div>
      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 600, color: T.grey900, overflowWrap: "break-word", wordBreak: "keep-all" }}>
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 16,
              lineHeight: "22px",
              color: T.grey500,
              ...twoLineText,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && (
        <span
          style={{
            flexShrink: 0,
            minWidth: 86,
            boxSizing: "border-box",
            padding: "12px 18px",
            borderRadius: 9999,
            background: actionBgColor,
            color: T.white,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: "20px",
            textAlign: "center",
          }}
        >
          {actionLabel}
        </span>
      )}
    </button>
  );
});
