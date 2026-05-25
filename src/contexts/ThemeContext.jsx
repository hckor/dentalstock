import { createContext, useContext } from "react";
import { T } from "../constants/colors";

const themeContextValue = { tokens: T };
const ThemeContext = createContext(themeContextValue);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
