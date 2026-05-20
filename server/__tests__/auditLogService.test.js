import { describe, expect, it } from "vitest";
import { createAuditLogService, sanitizeMetadata } from "../services/auditLogService.js";
import { createMemoryStore } from "../storage/memoryStore.js";

describe("audit log service", () => {
  it("creates append-only audit entries and exposes no mutation methods", async () => {
    const store = createMemoryStore({
      now: () => "2026-05-20T00:00:00.000Z",
      idFactory: prefix => `${prefix}_1`,
    });
    const service = createAuditLogService({
      auditLogStore: store.auditLogs,
      now: () => "2026-05-20T00:00:00.000Z",
    });

    const entry = await service.record({
      clinicId: "clinic-a",
      actor: { userId: "manager-1", role: "manager" },
      action: "order.approved",
      entity: "order",
      entityId: "order-1",
      metadata: { qty: 2 },
    });

    expect(entry).toMatchObject({
      auditId: "audit_1",
      clinicId: "clinic-a",
      action: "order.approved",
      entity: "order",
      entityId: "order-1",
      createdAt: "2026-05-20T00:00:00.000Z",
    });
    expect(service.update).toBeUndefined();
    expect(service.delete).toBeUndefined();
    expect(store.auditLogs.update).toBeUndefined();
    expect(store.auditLogs.delete).toBeUndefined();
  });

  it("returns cloned entries so reads cannot mutate stored audit logs", async () => {
    const store = createMemoryStore({
      now: () => "2026-05-20T00:00:00.000Z",
      idFactory: prefix => `${prefix}_1`,
    });
    const service = createAuditLogService({
      auditLogStore: store.auditLogs,
      now: () => "2026-05-20T00:00:00.000Z",
    });

    const saved = await service.record({
      clinicId: "clinic-a",
      action: "inventory.out",
      entity: "tx",
      entityId: "tx-1",
      metadata: { qty: 1 },
    });
    saved.metadata.qty = 999;

    const [stored] = await service.listByClinic({ clinicId: "clinic-a" });
    expect(stored.metadata.qty).toBe(1);
  });

  it("redacts sensitive metadata keys before persisting", async () => {
    expect(
      sanitizeMetadata({
        username: "visible-user",
        password: "secret",
        nested: { sessionToken: "secret-token", note: "safe" },
        cardNumber: "4111111111111111",
      }),
    ).toEqual({
      username: "visible-user",
      password: "[redacted]",
      nested: { sessionToken: "[redacted]", note: "safe" },
      cardNumber: "[redacted]",
    });
  });

  it("requires domain identity fields", async () => {
    const store = createMemoryStore();
    const service = createAuditLogService({ auditLogStore: store.auditLogs });

    await expect(service.record({ clinicId: "clinic-a", action: "x", entity: "order" })).rejects.toThrow(
      "entity_id_required",
    );
  });
});
