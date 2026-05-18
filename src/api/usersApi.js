import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INITIAL_USERS } from "../data/initialData";

export const usersApi = {
  list() {
    return storage.load(STORAGE_KEYS.users, INITIAL_USERS);
  },
  save(users) {
    storage.save(STORAGE_KEYS.users, users);
  },
};
