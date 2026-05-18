import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";

// 장바구니: 사용자별로 발주 요청 전 임시 보관
// shape: { [userId]: [{ item_id, qty, note }] }

function readAll() {
  return storage.load(STORAGE_KEYS.cart, {});
}
function writeAll(all) {
  storage.save(STORAGE_KEYS.cart, all);
}

export const cartApi = {
  list(userId) {
    return readAll()[userId] || [];
  },
  save(userId, cart) {
    const all = readAll();
    all[userId] = cart;
    writeAll(all);
  },
  clear(userId) {
    const all = readAll();
    delete all[userId];
    writeAll(all);
  },
};
