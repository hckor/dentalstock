import { appRepository } from "../repositories/appRepository";

export const ordersApi = {
  list() {
    return appRepository.orders.list();
  },
  save(orders) {
    appRepository.orders.save(orders);
  },
};
