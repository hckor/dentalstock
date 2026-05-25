import { createContext, useContext, useMemo } from "react";
import { useStockActions } from "../hooks/useStockActions";

const InventoryContext = createContext(null);

export function InventoryProvider({
  items,
  setItems,
  txs,
  setTxs,
  setNotifs,
  currentUser,
  showToast,
  setModal,
  children,
}) {
  const { commit } = useStockActions({ items, setItems, setTxs, setNotifs, currentUser, showToast, setModal });

  const value = useMemo(
    () => ({ items, setItems, txs, setTxs, commit }),
    [items, setItems, txs, setTxs, commit]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return ctx;
}
