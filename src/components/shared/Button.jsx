import { font } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";

const sizes = {
  sm: { padding: "8px 14px", fontSize: 13, height: 32 },
  md: { padding: "11px 20px", fontSize: 14, height: 40 },
  lg: { padding: "16px 24px", fontSize: 15, height: 52 },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  children,
  style = {},
  ...rest
}) {
  const { tokens: T } = useTheme();

  const variants = {
    // 파란색 배경 + 흰색 텍스트
    primary:   { background: T.blue500,  color: T.white,    border: "none" },
    // 빨간색 배경 + 흰색 텍스트
    danger:    { background: T.red500,   color: T.white,    border: "none" },
    // 연한 배경 + 진한 텍스트 (테두리 없음, 옅은 그레이 필)
    secondary: { background: T.grey100,  color: T.grey800,  border: "none" },
    // 테두리 없음 + 텍스트만
    ghost:     { background: "transparent", color: T.grey700, border: "none" },
  };

  return (
    <button
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 9999,
        cursor: "pointer",
        fontFamily: font,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: fullWidth ? "100%" : undefined,
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "opacity 120ms ease",
        ...style,
      }}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}
