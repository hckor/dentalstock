import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INIT_SURGERIES } from "../data/initialData";

export const surgeriesApi = {
  list() {
    return storage.load(STORAGE_KEYS.surgeries, INIT_SURGERIES);
  },
  save(surgeries) {
    storage.save(STORAGE_KEYS.surgeries, surgeries);
  },
};
