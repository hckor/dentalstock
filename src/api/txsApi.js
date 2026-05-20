import { appRepository } from "../repositories/appRepository";

export const txsApi = {
  list() {
    return appRepository.txs.list();
  },
  save(txs) {
    appRepository.txs.save(txs);
  },
};
