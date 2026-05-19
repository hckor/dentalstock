import { memo } from "react";
import { CS } from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";

export const Card = memo(function Card({ children, style = {} }) {
  const { tokens: T } = useTheme();
  return (
    <div
      style={{
        background: T.white,
        borderRadius: 12,
        border: "none",
        boxShadow: CS,
        ...style,
      }}
    >
      {children}
    </div>
  );
});
