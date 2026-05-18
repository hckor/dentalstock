import { createContext, useContext, useEffect, useState } from "react";
import { themeTokens } from "../constants/colors";

const STORAGE_KEY = "dentalstock:theme";

const ThemeContext = createContext({
  mode: "light",
  tokens: themeTokens.light,
  setMode: () => {},
  toggle: () => {},
});

function detectInitialMode() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* ignore */ }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(detectInitialMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch { /* ignore */ }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = mode;
    }
  }, [mode]);

  const setMode = (next) => setModeState(next === "dark" ? "dark" : "light");
  const toggle = () => setModeState(m => m === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ mode, tokens: themeTokens[mode], setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
