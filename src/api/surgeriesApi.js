import { appRepository } from "../repositories/appRepository";

export const surgeriesApi = {
  list() {
    return appRepository.surgeries.list();
  },
  save(surgeries) {
    appRepository.surgeries.save(surgeries);
  },
};
