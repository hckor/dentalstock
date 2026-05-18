import { storage } from "../services/storage";
import {
  INITIAL_USERS, INIT_ITEMS, INIT_TXS, INIT_ORDERS, INIT_SURGERIES, INIT_NOTIFS,
} from "../data/initialData";
import { STORAGE_KEYS } from "./keys";

// 첫 실행 또는 버전 변경 시 초기 데이터를 채워 넣음
export function seedIfEmpty() {
  storage.ensureVersion(() => {
    storage.save(STORAGE_KEYS.users,     INITIAL_USERS);
    storage.save(STORAGE_KEYS.items,     INIT_ITEMS);
    storage.save(STORAGE_KEYS.txs,       INIT_TXS);
    storage.save(STORAGE_KEYS.orders,    INIT_ORDERS);
    storage.save(STORAGE_KEYS.surgeries, INIT_SURGERIES);
    storage.save(STORAGE_KEYS.notifs,    INIT_NOTIFS);
  });
}

// 데모/개발용: 모든 데이터를 초기화 후 초기 데이터로 되돌림
export function resetToInitial() {
  storage.clearAll();
  storage.save(STORAGE_KEYS.users,     INITIAL_USERS);
  storage.save(STORAGE_KEYS.items,     INIT_ITEMS);
  storage.save(STORAGE_KEYS.txs,       INIT_TXS);
  storage.save(STORAGE_KEYS.orders,    INIT_ORDERS);
  storage.save(STORAGE_KEYS.surgeries, INIT_SURGERIES);
  storage.save(STORAGE_KEYS.notifs,    INIT_NOTIFS);
}
