export const REPOSITORY_CONTRACT = Object.freeze({
  auditLogs: Object.freeze(["create", "listByClinic"]),
  orderJobs: Object.freeze(["enqueue", "listQueued", "markRunning", "markComplete", "markFailed"]),
  items: Object.freeze(["upsert", "getById", "listByClinic", "applyQuantityDelta"]),
  orders: Object.freeze(["create", "getById", "listByClinic", "updateStatus"]),
});

const MUTATION_METHODS = new Set(["update", "delete", "remove", "clear"]);

export function assertRepositoryContract(repository) {
  if (!repository || typeof repository !== "object") {
    throw new Error("repository_required");
  }

  Object.entries(REPOSITORY_CONTRACT).forEach(([storeName, methodNames]) => {
    const store = repository[storeName];
    if (!store || typeof store !== "object") {
      throw new Error(`${storeName}_repository_required`);
    }

    methodNames.forEach(methodName => {
      if (typeof store[methodName] !== "function") {
        throw new Error(`${storeName}.${methodName}_required`);
      }
    });
  });

  ["auditLogs"].forEach(storeName => {
    MUTATION_METHODS.forEach(methodName => {
      if (repository[storeName][methodName] !== undefined) {
        throw new Error(`${storeName}.${methodName}_forbidden`);
      }
    });
  });

  return repository;
}
