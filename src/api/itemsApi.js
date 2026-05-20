import { appRepository } from "../repositories/appRepository";

export const itemsApi = {
  list() {
    return appRepository.items.list();
  },
  save(items) {
    appRepository.items.save(items);
  },
};
