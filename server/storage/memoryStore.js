function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createMemoryStore({ now = () => new Date().toISOString(), idFactory = createId } = {}) {
  const auditLogs = [];
  const orderJobs = [];
  const items = [];
  const orders = [];

  function findScopedIndex(collection, { clinicId, idField, idValue }) {
    return collection.findIndex(entry => entry.clinicId === clinicId && entry[idField] === idValue);
  }

  const auditLogStore = Object.freeze({
    async create(entry) {
      const saved = Object.freeze({
        ...clone(entry),
        auditId: entry.auditId || idFactory("audit"),
        createdAt: entry.createdAt || now(),
      });
      auditLogs.push(saved);
      return clone(saved);
    },

    async listByClinic({ clinicId, limit = 100 } = {}) {
      return auditLogs
        .filter(entry => entry.clinicId === clinicId)
        .slice(-limit)
        .map(clone);
    },
  });

  const orderJobStore = Object.freeze({
    async enqueue(job) {
      const saved = Object.freeze({
        ...clone(job),
        jobId: job.jobId || idFactory("order_job"),
        status: "queued",
        createdAt: job.createdAt || now(),
      });
      orderJobs.push(saved);
      return clone(saved);
    },

    async listQueued({ clinicId, limit = 100 } = {}) {
      return orderJobs
        .filter(job => job.clinicId === clinicId && job.status === "queued")
        .slice(0, limit)
        .map(clone);
    },

    async markRunning({ jobId, startedAt = now() } = {}) {
      const index = orderJobs.findIndex(job => job.jobId === jobId);
      if (index === -1) return null;
      const next = Object.freeze({ ...clone(orderJobs[index]), status: "running", startedAt });
      orderJobs[index] = next;
      return clone(next);
    },

    async markComplete({ jobId, completedAt = now(), result = {} } = {}) {
      const index = orderJobs.findIndex(job => job.jobId === jobId);
      if (index === -1) return null;
      const next = Object.freeze({ ...clone(orderJobs[index]), status: "completed", completedAt, result: clone(result) });
      orderJobs[index] = next;
      return clone(next);
    },

    async markFailed({ jobId, failedAt = now(), error = "worker_failed" } = {}) {
      const index = orderJobs.findIndex(job => job.jobId === jobId);
      if (index === -1) return null;
      const next = Object.freeze({ ...clone(orderJobs[index]), status: "failed", failedAt, error: String(error).slice(0, 160) });
      orderJobs[index] = next;
      return clone(next);
    },
  });

  const itemStore = Object.freeze({
    async upsert(item) {
      const saved = Object.freeze({
        ...clone(item),
        itemId: item.itemId || idFactory("item"),
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      });
      const index = findScopedIndex(items, { clinicId: saved.clinicId, idField: "itemId", idValue: saved.itemId });
      if (index === -1) {
        items.push(saved);
      } else {
        items[index] = Object.freeze({ ...clone(items[index]), ...clone(saved), createdAt: items[index].createdAt });
      }
      return clone(index === -1 ? saved : items[index]);
    },

    async getById({ clinicId, itemId } = {}) {
      const item = items.find(entry => entry.clinicId === clinicId && entry.itemId === itemId);
      return item ? clone(item) : null;
    },

    async listByClinic({ clinicId, limit = 100 } = {}) {
      return items
        .filter(item => item.clinicId === clinicId)
        .slice(0, limit)
        .map(clone);
    },

    async applyQuantityDelta({ clinicId, itemId, delta, updatedAt = now() } = {}) {
      const index = findScopedIndex(items, { clinicId, idField: "itemId", idValue: itemId });
      if (index === -1) return null;
      const currentQty = Number(items[index].currentQty || 0) + delta;
      const next = Object.freeze({ ...clone(items[index]), currentQty, updatedAt });
      items[index] = next;
      return clone(next);
    },
  });

  const orderStore = Object.freeze({
    async create(order) {
      const timestamp = now();
      const saved = Object.freeze({
        ...clone(order),
        orderId: order.orderId || idFactory("order"),
        status: order.status || "pending",
        requestedAt: order.requestedAt || timestamp,
        createdAt: order.createdAt || timestamp,
        updatedAt: order.updatedAt || timestamp,
      });
      orders.push(saved);
      return clone(saved);
    },

    async getById({ clinicId, orderId } = {}) {
      const order = orders.find(entry => entry.clinicId === clinicId && entry.orderId === orderId);
      return order ? clone(order) : null;
    },

    async listByClinic({ clinicId, status, limit = 100 } = {}) {
      return orders
        .filter(order => order.clinicId === clinicId && (status === undefined || order.status === status))
        .slice(0, limit)
        .map(clone);
    },

    async updateStatus({ clinicId, orderId, status, updatedAt = now(), ...patch } = {}) {
      const index = findScopedIndex(orders, { clinicId, idField: "orderId", idValue: orderId });
      if (index === -1) return null;
      const next = Object.freeze({
        ...clone(orders[index]),
        ...clone(patch),
        status,
        updatedAt,
      });
      orders[index] = next;
      return clone(next);
    },
  });

  return Object.freeze({
    auditLogs: auditLogStore,
    orderJobs: orderJobStore,
    items: itemStore,
    orders: orderStore,
  });
}
