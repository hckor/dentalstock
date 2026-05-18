import { useState } from "react";

export function useToast() {
  const [t, setT] = useState(null);
  const show = (msg) => { setT(msg); setTimeout(() => setT(null), 2400); };
  return [t, show];
}
