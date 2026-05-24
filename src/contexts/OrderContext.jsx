import { createContext, useContext, useMemo } from "react";
import { useOrderActions } from "../hooks/useOrderActions";

const OrderContext = createContext(null);

export function OrderProvider({
  orders,
  setOrders,
  items,
  setItems,
  setTxs,
  setNotifs,
  currentUser,
  showToast,
  setModal,
  children,
}) {
  const actions = useOrderActions({
    orders, setOrders, items, setItems, setTxs, setNotifs, currentUser, showToast, setModal,
  });

  const value = useMemo(
    () => ({ orders, setOrders, ...actions }),
    [orders, setOrders, actions]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return ctx;
}
