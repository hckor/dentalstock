import { font } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";

const sizes = {
  sm: { padding: "8px 14px", fontSize: 13, height: 32 },
  md: { padding: "11px 20px", fontSize: 14, height: 40 },
  lg: { padding: "16px 24px", fontSize: 15, height: 52 },
};

export function Button({ variant = "primary", size = "md", fullWidth = false, leftIcon, children, style = {}, ...rest }) {
  const { tokens: T } = useTheme();

  const variants = {
    primary:   { background: T.blue500,      color: T.white,    border: "none" },
    secondary: { background: T.white,        color: T.grey700,  border: `1.5px solid ${T.grey200}` },
    danger:    { background: T.red50,        color: T.red500,   border: `1.5px solid ${T.red500}` },
    ghost:     { background: "transparent",  color: T.grey700,  border: "none" },
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
        ...style,
      }}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}
