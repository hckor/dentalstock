// ─── STORAGE ADAPTER ──────────────────────────────────
// 추상화된 저장소 인터페이스. 미래에 Supabase, Firebase, REST API 등으로 교체 가능.
// 현재 구현: localStorage (브라우저 단일 디바이스 영속화)

const PREFIX = "dentalstock:";
const VERSION_KEY = `${PREFIX}__version`;
const CURRENT_VERSION = 1;

function isStorageAvailable() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const t = "__ds_test__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

const memoryStore = new Map();

function rawGet(key) {
  if (isStorageAvailable()) return window.localStorage.getItem(key);
  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

function rawSet(key, value) {
  if (isStorageAvailable()) { window.localStorage.setItem(key, value); return; }
  memoryStore.set(key, value);
}

function rawRemove(key) {
  if (isStorageAvailable()) { window.localStorage.removeItem(key); return; }
  memoryStore.delete(key);
}

export const storage = {
  load(key, fallback) {
    try {
      const raw = rawGet(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  save(key, value) {
    try {
      rawSet(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    rawRemove(PREFIX + key);
  },
  clearAll() {
    if (isStorageAvailable()) {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach(k => window.localStorage.removeItem(k));
    } else {
      memoryStore.clear();
    }
  },
  ensureVersion(seedFn) {
    const stored = parseInt(rawGet(VERSION_KEY) || "0", 10);
    if (stored !== CURRENT_VERSION) {
      this.clearAll();
      seedFn();
      rawSet(VERSION_KEY, String(CURRENT_VERSION));
    }
  },
};
