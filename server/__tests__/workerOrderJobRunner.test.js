import { describe, expect, it, vi } from "vitest";
import { createOrderJobRunner } from "../workers/orderJobRunner.js";

const NOW = "2026-05-20T00:00:00.000Z";

function createHarness({ provider, credentials } = {}) {
  const jobs = [];
  const audits = [];
  const orderJobStore = {
    markRunning: vi.fn(async patch => {
      jobs.push({ status: "running", ...patch });
      return { ...patch, status: "running" };
    }),
    markComplete: vi.fn(async patch => {
      jobs.push({ status: "completed", ...patch });
      return { ...patch, status: "completed" };
    }),
    markFailed: vi.fn(async patch => {
      jobs.push({ status: "failed", ...patch });
      return { ...patch, status: "failed" };
    }),
  };
  const auditLogService = {
    record: vi.fn(async entry => {
      audits.push(entry);
      return { auditId: `audit_${audits.length}`, ...entry };
    }),
  };
  const credentialService = {
    getForWorker: vi.fn(async () => credentials || {
      username: "vendor-user",
      password: "super-secret-password",
      sessionToken: "secret-session-token",
    }),
  };
  const orderProvider = provider || {
    submitOrder: vi.fn(async () => ({ providerOrderId: "PO-1", sessionToken: "must-not-persist" })),
  };

  const runner = createOrderJobRunner({
    orderJobStore,
    auditLogService,
    credentialService,
    orderProvider,
    now: () => NOW,
  });

  return { runner, orderJobStore, auditLogService, credentialService, orderProvider, jobs, audits };
}

function approvedJob(overrides = {}) {
  return {
    jobId: "job-1",
    clinicId: "clinic-a",
    orderId: "order-1",
    vendorId: "vendor-a",
    requestedBy: "manager-a",
    approvedBy: "owner-a",
    approvedAt: NOW,
    orderStatus: "ordered",
    maxOrderAmount: 50000,
    status: "queued",
    ...overrides,
  };
}

describe("order job runner boundary", () => {
  it("runs only approved queued order jobs through credential service and provider interfaces", async () => {
    const harness = createHarness();

    await expect(harness.runner.run(approvedJob())).resolves.toMatchObject({
      status: "completed",
      result: {
        providerOrderId: "PO-1",
        sessionToken: "[redacted]",
      },
    });

    expect(harness.credentialService.getForWorker).toHaveBeenCalledWith({
      clinicId: "clinic-a",
      vendorId: "vendor-a",
      purpose: "order.worker",
    });
    expect(harness.orderProvider.submitOrder).toHaveBeenCalledWith({
      job: {
        jobId: "job-1",
        clinicId: "clinic-a",
        orderId: "order-1",
        vendorId: "vendor-a",
        requestedBy: "manager-a",
        approvedBy: "owner-a",
        approvedAt: NOW,
        maxOrderAmount: 50000,
      },
      credentials: {
        username: "vendor-user",
        password: "super-secret-password",
        sessionToken: "secret-session-token",
      },
    });
    expect(harness.orderJobStore.markRunning).toHaveBeenCalledBefore(harness.orderProvider.submitOrder);
    expect(harness.auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      action: "order.worker.started",
      entity: "order",
      entityId: "order-1",
    }));
    expect(harness.auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      action: "order.worker.completed",
      metadata: expect.objectContaining({
        result: {
          providerOrderId: "PO-1",
          sessionToken: "[redacted]",
        },
      }),
    }));
  });

  it("rejects unapproved jobs before credentials or provider code can run", async () => {
    const harness = createHarness();

    await expect(harness.runner.run(approvedJob({ approvedBy: "", approvedAt: "" }))).rejects.toThrow(
      "order_job_not_approved",
    );

    expect(harness.orderJobStore.markRunning).not.toHaveBeenCalled();
    expect(harness.credentialService.getForWorker).not.toHaveBeenCalled();
    expect(harness.orderProvider.submitOrder).not.toHaveBeenCalled();
    expect(harness.auditLogService.record).not.toHaveBeenCalled();
  });

  it("rejects non-approved order status jobs before running", async () => {
    const harness = createHarness();

    await expect(harness.runner.run(approvedJob({ orderStatus: "draft" }))).rejects.toThrow(
      "order_not_approved_for_worker",
    );

    expect(harness.credentialService.getForWorker).not.toHaveBeenCalled();
    expect(harness.orderProvider.submitOrder).not.toHaveBeenCalled();
  });

  it("records masked failure audit logs and masked job errors", async () => {
    const provider = {
      submitOrder: vi.fn(async () => {
        throw new Error("vendor password=abc sessionToken=def cookie=ghi failed");
      }),
    };
    const harness = createHarness({ provider });

    await expect(harness.runner.run(approvedJob())).rejects.toThrow("vendor password=abc");

    expect(harness.orderJobStore.markFailed).toHaveBeenCalledWith({
      jobId: "job-1",
      failedAt: NOW,
      error: "vendor [redacted]=abc [redacted]=def [redacted]=ghi failed",
    });
    expect(harness.auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      action: "order.worker.failed",
      metadata: expect.objectContaining({
        error: "vendor [redacted]=abc [redacted]=def [redacted]=ghi failed",
        errorCode: "worker_failed",
      }),
    }));
    expect(JSON.stringify(harness.audits)).not.toContain("password");
    expect(JSON.stringify(harness.audits)).not.toContain("sessionToken");
    expect(JSON.stringify(harness.audits)).not.toContain("cookie");
  });
});
