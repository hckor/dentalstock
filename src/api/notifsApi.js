import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INIT_NOTIFS } from "../data/initialData";

export const notifsApi = {
  list() {
    return storage.load(STORAGE_KEYS.notifs, INIT_NOTIFS);
  },
  save(notifs) {
    storage.save(STORAGE_KEYS.notifs, notifs);
  },
};
