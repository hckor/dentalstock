import { createContext, useContext } from "react";
import { T } from "../constants/colors";

const ThemeContext = createContext({ tokens: T });

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ tokens: T }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
