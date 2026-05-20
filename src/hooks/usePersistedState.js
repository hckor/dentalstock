import { useState, useEffect, useRef } from "react";

// React state + 외부 저장소를 동기화.
// initialLoader: () => 초기값 (storage에서 읽거나 INIT 데이터 반환)
// persister:     (value) => storage에 저장
// 첫 마운트 시점에는 setter 호출이 없으므로 저장하지 않음 (불필요한 쓰기 방지).
// JSON.stringify 기반 deep equality로 변경 없을 때 write 스킵.
export function usePersistedState(initialLoader, persister, { enabled = true } = {}) {
  const [state, setState] = useState(initialLoader);
  const isFirst = useRef(true);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      lastSavedRef.current = JSON.stringify(state);
      return;
    }
    if (!enabled) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedRef.current) return; // 동일 값이면 저장 스킵
    lastSavedRef.current = serialized;
    persister(state);
    // persister/loader는 모듈 스코프에서 안정적으로 정의되므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, setState];
}
