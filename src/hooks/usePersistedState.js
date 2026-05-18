import { useState, useEffect, useRef } from "react";

// React state + 외부 저장소를 동기화.
// initialLoader: () => 초기값 (storage에서 읽거나 INIT 데이터 반환)
// persister:     (value) => storage에 저장
// 첫 마운트 시점에는 setter 호출이 없으므로 저장하지 않음 (불필요한 쓰기 방지).
export function usePersistedState(initialLoader, persister) {
  const [state, setState] = useState(initialLoader);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    persister(state);
    // persister/loader는 모듈 스코프에서 안정적으로 정의되므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, setState];
}
