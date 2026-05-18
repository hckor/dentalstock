import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INIT_ORDERS } from "../data/initialData";

export const ordersApi = {
  list() {
    return storage.load(STORAGE_KEYS.orders, INIT_ORDERS);
  },
  save(orders) {
    storage.save(STORAGE_KEYS.orders, orders);
  },
};
