import { appRepository } from "../repositories/appRepository";

export const notifsApi = {
  list() {
    return appRepository.notifs.list();
  },
  save(notifs) {
    appRepository.notifs.save(notifs);
  },
};
