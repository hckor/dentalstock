import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INIT_ITEMS } from "../data/initialData";

export const itemsApi = {
  list() {
    return storage.load(STORAGE_KEYS.items, INIT_ITEMS);
  },
  save(items) {
    storage.save(STORAGE_KEYS.items, items);
  },
};
