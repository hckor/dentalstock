import { useRef } from "react";

export function usePushNotifications() {
  const firedPushesRef    = useRef(new Set());
  const firedRemindersRef = useRef(new Set());

  const requestPushPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(()=>{});
    }
  };

  const firePush = (key, title, body) => {
    if (firedPushesRef.current.has(key)) return;
    firedPushesRef.current.add(key);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, {body, tag:key}); } catch { /* push silently fails */ }
    }
  };

  return { firePush, requestPushPermission, firedPushesRef, firedRemindersRef };
}
