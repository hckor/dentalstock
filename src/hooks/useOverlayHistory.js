import { useCallback, useEffect, useRef } from "react";

// iOS 뒤로쓸어넘기기 제스처 지원: 오버레이가 열릴 때 history entry 추가하고,
// popstate (뒤로 제스처/버튼)로 오버레이를 닫는다.
export function useOverlayHistory(overlayClosers) {
  const hasEntryRef = useRef(false);

  const open = useCallback((openFn) => {
    window.history.pushState({ overlay: true }, "");
    hasEntryRef.current = true;
    openFn();
  }, []);

  const close = useCallback((closeFn) => {
    if (hasEntryRef.current) {
      hasEntryRef.current = false;
      window.history.back();
    } else {
      closeFn();
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      hasEntryRef.current = false;
      for (const { isOpen, close } of overlayClosers) {
        if (isOpen) { close(); break; }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [overlayClosers]);

  return { open, close };
}
