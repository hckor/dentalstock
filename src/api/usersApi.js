import { appRepository } from "../repositories/appRepository";

export const usersApi = {
  list() {
    return appRepository.users.list();
  },
  save(users) {
    appRepository.users.save(users);
  },
};
