import { STORAGE_KEYS } from "../api/keys";
import {
  INITIAL_USERS,
  INIT_ITEMS,
  INIT_TXS,
  INIT_ORDERS,
  INIT_SURGERIES,
  INIT_NOTIFS,
} from "../data/initialData";
import {
  createCollectionRepository,
  createValueRepository,
  localRepository,
} from "./localRepository";

function writeInitialData() {
  appRepository.users.save(INITIAL_USERS);
  appRepository.items.save(INIT_ITEMS);
  appRepository.txs.save(INIT_TXS);
  appRepository.orders.save(INIT_ORDERS);
  appRepository.surgeries.save(INIT_SURGERIES);
  appRepository.notifs.save(INIT_NOTIFS);
}

export const appRepository = {
  users: createCollectionRepository(STORAGE_KEYS.users, INITIAL_USERS),
  items: createCollectionRepository(STORAGE_KEYS.items, INIT_ITEMS),
  txs: createCollectionRepository(STORAGE_KEYS.txs, INIT_TXS),
  orders: createCollectionRepository(STORAGE_KEYS.orders, INIT_ORDERS),
  surgeries: createCollectionRepository(STORAGE_KEYS.surgeries, INIT_SURGERIES),
  notifs: createCollectionRepository(STORAGE_KEYS.notifs, INIT_NOTIFS),
  settings: createValueRepository(STORAGE_KEYS.settings, null),
  vendorCredentials: createValueRepository(STORAGE_KEYS.vendorCredentials, {}),
  auditLogs: createCollectionRepository(STORAGE_KEYS.auditLogs, []),
  session: createValueRepository(STORAGE_KEYS.session, null),
  authAttempts: createValueRepository(STORAGE_KEYS.authAttempts, {}),

  seedIfEmpty() {
    localRepository.ensureVersion(writeInitialData);
  },

  resetToInitial() {
    localRepository.clearAll();
    writeInitialData();
  },
};
