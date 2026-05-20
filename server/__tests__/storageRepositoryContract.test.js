import { describe, expect, it } from "vitest";
import { assertRepositoryContract } from "../storage/repositoryContract.js";
import { createMemoryStore } from "../storage/memoryStore.js";

function createDeterministicStore() {
  let id = 0;
  return createMemoryStore({
    now: () => "2026-05-20T00:00:00.000Z",
    idFactory: prefix => `${prefix}_${++id}`,
  });
}

export function runStorageRepositoryContract(name, createRepository) {
  describe(`${name} storage repository contract`, () => {
    it("implements the DB adapter interface shape", () => {
      const repository = assertRepositoryContract(createRepository());

      expect(repository.auditLogs.update).toBeUndefined();
      expect(repository.auditLogs.delete).toBeUndefined();
    });

    it("keeps audit logs append-only, scoped, and immutable to callers", async () => {
      const repository = createRepository();

      const saved = await repository.auditLogs.create({
        clinicId: "clinic-a",
        action: "order.approved",
        entity: "order",
        entityId: "order-1",
        metadata: { qty: 2 },
      });
      await repository.auditLogs.create({
        clinicId: "clinic-b",
        action: "order.approved",
        entity: "order",
        entityId: "order-2",
      });
      saved.metadata.qty = 999;

      const logs = await repository.auditLogs.listByClinic({ clinicId: "clinic-a" });

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        auditId: "audit_1",
        clinicId: "clinic-a",
        action: "order.approved",
        entity: "order",
        entityId: "order-1",
        metadata: { qty: 2 },
        createdAt: "2026-05-20T00:00:00.000Z",
      });
    });

    it("queues and advances order jobs without crossing clinic boundaries", async () => {
      const repository = createRepository();

      const queued = await repository.orderJobs.enqueue({
        clinicId: "clinic-a",
        orderId: "order-1",
        vendorId: "denall",
      });
      await repository.orderJobs.enqueue({
        clinicId: "clinic-b",
        orderId: "order-2",
        vendorId: "other",
      });

      expect(await repository.orderJobs.listQueued({ clinicId: "clinic-a" })).toMatchObject([
        {
          jobId: queued.jobId,
          clinicId: "clinic-a",
          orderId: "order-1",
          status: "queued",
        },
      ]);

      const running = await repository.orderJobs.markRunning({
        jobId: queued.jobId,
        startedAt: "2026-05-20T00:01:00.000Z",
      });
      expect(running).toMatchObject({ status: "running", startedAt: "2026-05-20T00:01:00.000Z" });
      expect(await repository.orderJobs.listQueued({ clinicId: "clinic-a" })).toEqual([]);

      const completed = await repository.orderJobs.markComplete({
        jobId: queued.jobId,
        completedAt: "2026-05-20T00:02:00.000Z",
        result: { vendorOrderNo: "VO-1" },
      });
      completed.result.vendorOrderNo = "mutated";

      const failed = await repository.orderJobs.markFailed({
        jobId: "missing",
        error: "not found",
      });
      expect(failed).toBeNull();
    });

    it("stores clinic-scoped items and applies quantity deltas atomically", async () => {
      const repository = createRepository();

      const item = await repository.items.upsert({
        clinicId: "clinic-a",
        name: "Gloves",
        currentQty: 10,
        minQty: 3,
      });
      await repository.items.upsert({
        clinicId: "clinic-b",
        itemId: item.itemId,
        name: "Other clinic gloves",
        currentQty: 99,
      });

      item.name = "mutated";
      const updated = await repository.items.applyQuantityDelta({
        clinicId: "clinic-a",
        itemId: item.itemId,
        delta: -4,
        updatedAt: "2026-05-20T00:03:00.000Z",
      });

      expect(updated).toMatchObject({
        clinicId: "clinic-a",
        itemId: item.itemId,
        name: "Gloves",
        currentQty: 6,
        updatedAt: "2026-05-20T00:03:00.000Z",
      });
      expect(await repository.items.getById({ clinicId: "clinic-a", itemId: item.itemId })).toMatchObject({
        name: "Gloves",
        currentQty: 6,
      });
      expect(await repository.items.listByClinic({ clinicId: "clinic-a" })).toHaveLength(1);
      expect(await repository.items.applyQuantityDelta({ clinicId: "clinic-a", itemId: "missing", delta: 1 })).toBeNull();
    });

    it("stores clinic-scoped orders and records status transitions", async () => {
      const repository = createRepository();

      const order = await repository.orders.create({
        clinicId: "clinic-a",
        itemId: "item-1",
        qty: 2,
        requestedBy: "user-1",
      });
      await repository.orders.create({
        clinicId: "clinic-a",
        itemId: "item-2",
        qty: 1,
        status: "received",
        requestedBy: "user-1",
      });
      await repository.orders.create({
        clinicId: "clinic-b",
        orderId: order.orderId,
        itemId: "item-1",
        qty: 8,
        requestedBy: "user-2",
      });

      expect(order).toMatchObject({
        orderId: "order_1",
        clinicId: "clinic-a",
        status: "pending",
        requestedAt: "2026-05-20T00:00:00.000Z",
        createdAt: "2026-05-20T00:00:00.000Z",
        updatedAt: "2026-05-20T00:00:00.000Z",
      });

      const transitioned = await repository.orders.updateStatus({
        clinicId: "clinic-a",
        orderId: order.orderId,
        status: "ordered",
        reviewedBy: "manager-1",
        reviewedAt: "2026-05-20T00:04:00.000Z",
        vendorId: "denall",
      });
      transitioned.vendorId = "mutated";

      expect(await repository.orders.getById({ clinicId: "clinic-a", orderId: order.orderId })).toMatchObject({
        status: "ordered",
        reviewedBy: "manager-1",
        vendorId: "denall",
      });
      expect(await repository.orders.listByClinic({ clinicId: "clinic-a", status: "ordered" })).toHaveLength(1);
      expect(await repository.orders.updateStatus({ clinicId: "clinic-a", orderId: "missing", status: "failed" })).toBeNull();
    });
  });
}

runStorageRepositoryContract("memory", createDeterministicStore);
