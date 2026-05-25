import { createContext, useContext, useMemo } from "react";
import { useSurgeryActions } from "../hooks/useSurgeryActions";

const SurgeryContext = createContext(null);

export function SurgeryProvider({
  surgeries,
  setSurgeries,
  items,
  setItems,
  setTxs,
  setNotifs,
  currentUser,
  showToast,
  firePush,
  firedRemindersRef,
  children,
}) {
  const actions = useSurgeryActions({
    surgeries, setSurgeries, items, setItems, setTxs, setNotifs,
    currentUser, showToast, firePush, firedRemindersRef,
  });

  const value = useMemo(
    () => ({ surgeries, setSurgeries, ...actions }),
    [surgeries, setSurgeries, actions]
  );

  return (
    <SurgeryContext.Provider value={value}>
      {children}
    </SurgeryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSurgery() {
  const ctx = useContext(SurgeryContext);
  if (!ctx) {
    throw new Error("useSurgery must be used within a SurgeryProvider");
  }
  return ctx;
}
