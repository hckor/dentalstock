import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";
import { INIT_TXS } from "../data/initialData";

export const txsApi = {
  list() {
    return storage.load(STORAGE_KEYS.txs, INIT_TXS);
  },
  save(txs) {
    storage.save(STORAGE_KEYS.txs, txs);
  },
};
