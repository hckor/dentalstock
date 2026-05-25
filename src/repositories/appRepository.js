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
import { getRepositoryAdapter } from "./repositoryAdapter";
import { todayKey } from "../utils/helpers";

function writeInitialData() {
  appRepository.users.save(INITIAL_USERS);
  appRepository.items.save(INIT_ITEMS);
  appRepository.txs.save(INIT_TXS);
  appRepository.orders.save(INIT_ORDERS);
  appRepository.surgeries.save(INIT_SURGERIES);
  appRepository.notifs.save(INIT_NOTIFS);
}

function appendMissingDemoUsers() {
  const users = appRepository.users.list();
  const existingIds = new Set(users.map(user => user.id));
  const missingUsers = INITIAL_USERS.filter(user => !existingIds.has(user.id));
  if (missingUsers.length === 0) return;
  appRepository.users.save([...users, ...missingUsers]);
}

function refreshDemoSurgeryDates() {
  const today = todayKey();
  const demoById = new Map(INIT_SURGERIES.map(surgery => [surgery.id, surgery]));
  const surgeries = appRepository.surgeries.list();
  let changed = false;
  const nextSurgeries = surgeries.map(surgery => {
    const demo = demoById.get(surgery.id);
    if (!demo || !surgery.scheduled_date || surgery.scheduled_date >= today) return surgery;
    changed = true;
    return {
      ...surgery,
      scheduled_date: demo.scheduled_date,
      scheduled_time: demo.scheduled_time,
      prep_confirmed: demo.prep_confirmed,
      prepared_by: demo.prepared_by,
      prepared_at: demo.prepared_at,
      usage_confirmed: demo.usage_confirmed,
    };
  });
  if (changed) appRepository.surgeries.save(nextSurgeries);
}

export const appRepository = {
  adapter: getRepositoryAdapter(),
  users: createCollectionRepository(STORAGE_KEYS.users, INITIAL_USERS),
  items: createCollectionRepository(STORAGE_KEYS.items, INIT_ITEMS),
  txs: createCollectionRepository(STORAGE_KEYS.txs, INIT_TXS),
  orders: createCollectionRepository(STORAGE_KEYS.orders, INIT_ORDERS),
  surgeries: createCollectionRepository(STORAGE_KEYS.surgeries, INIT_SURGERIES),
  notifs: createCollectionRepository(STORAGE_KEYS.notifs, INIT_NOTIFS),
  settings: createValueRepository(STORAGE_KEYS.settings, null),
  auditLogs: createCollectionRepository(STORAGE_KEYS.auditLogs, []),
  session: createValueRepository(STORAGE_KEYS.session, null),
  authAttempts: createValueRepository(STORAGE_KEYS.authAttempts, {}),

  seedIfEmpty() {
    localRepository.ensureVersion(writeInitialData);
    refreshDemoSurgeryDates();
  },

  ensureDemoProfiles() {
    appendMissingDemoUsers();
  },

  resetToInitial() {
    localRepository.clearAll();
    writeInitialData();
  },

  clearLocalData() {
    localRepository.clearAll();
  },
};
