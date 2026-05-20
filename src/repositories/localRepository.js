import { storage } from "../services/storage";

export const localRepository = {
  read(key, fallback = null) {
    return storage.load(key, fallback);
  },
  write(key, value) {
    return storage.save(key, value);
  },
  remove(key) {
    storage.remove(key);
  },
  clearAll() {
    storage.clearAll();
  },
  ensureVersion(seedFn) {
    storage.ensureVersion(seedFn);
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
