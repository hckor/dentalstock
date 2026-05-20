import { storage } from "../services/storage";

export const DEFAULT_CLINIC_ID = "demo-clinic";

const CLINIC_VERSION_KEY = "__clinic_version";
const CURRENT_CLINIC_VERSION = 1;
const GLOBAL_KEYS = new Set(["session", "auth_attempts"]);

let activeClinicId = DEFAULT_CLINIC_ID;

function normalizeClinicId(clinicId) {
  const value = String(clinicId || "").trim();
  return value || DEFAULT_CLINIC_ID;
}

function shouldScopeKey(key) {
  return !GLOBAL_KEYS.has(key);
}

function scopedKey(key) {
  if (!shouldScopeKey(key)) return key;
  return `clinics:${activeClinicId}:${key}`;
}

function readWithLegacyFallback(key, fallback) {
  const scoped = scopedKey(key);
  const scopedValue = storage.load(scoped, undefined);
  if (scopedValue !== undefined) return scopedValue;
  if (scoped !== key) return storage.load(key, fallback);
  return fallback;
}

export function getActiveClinicId() {
  return activeClinicId;
}

export function setActiveClinicId(clinicId) {
  activeClinicId = normalizeClinicId(clinicId);
}

export const localRepository = {
  read(key, fallback = null) {
    return readWithLegacyFallback(key, fallback);
  },
  write(key, value) {
    return storage.save(scopedKey(key), value);
  },
  remove(key) {
    storage.remove(scopedKey(key));
  },
  clearAll() {
    storage.clearAll();
  },
  ensureVersion(seedFn) {
    const stored = Number(this.read(CLINIC_VERSION_KEY, 0));
    if (stored !== CURRENT_CLINIC_VERSION) {
      seedFn();
      this.write(CLINIC_VERSION_KEY, CURRENT_CLINIC_VERSION);
    }
  },
};

export function createCollectionRepository(key, fallback) {
  return {
    list() {
      return localRepository.read(key, fallback);
    },
    save(records) {
      return localRepository.write(key, records);
    },
  };
}

export function createValueRepository(key, fallback = null) {
  return {
    get() {
      return localRepository.read(key, fallback);
    },
    set(value) {
      return localRepository.write(key, value);
    },
    remove() {
      localRepository.remove(key);
    },
  };
}
