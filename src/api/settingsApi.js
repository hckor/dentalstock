import { storage } from "../services/storage";
import { STORAGE_KEYS } from "./keys";

const DEFAULTS = {
  vendors: [
    { id: 1, name: "덴올",    connected: true  },
    { id: 2, name: "오스템몰", connected: true  },
    { id: 3, name: "이덴트",   connected: false },
  ],
  preferredVendor: "lowest",   // lowest | fastest | most_stock
  maxOrderAmount: "50000",
};

export const settingsApi = {
  load() {
    const saved = storage.load(STORAGE_KEYS.settings, null);
    return { ...DEFAULTS, ...(saved || {}) };
  },
  save(settings) {
    storage.save(STORAGE_KEYS.settings, settings);
  },
};
