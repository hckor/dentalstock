const APPROVED_ORDER_STATUSES = new Set(["ordered", "approved"]);
const SENSITIVE_KEY_PATTERN = /(password|passwd|secret|token|session|cookie|pin|card|credential)/i;
const SENSITIVE_WORD_PATTERN = /(sessionToken|authToken|accessToken|refreshToken|password|passwd|secret|token|session|cookie|pin|card|credential)/gi;
const MAX_ERROR_LENGTH = 160;

function workerError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function assertWorkerStore(orderJobStore) {
  for (const method of ["markRunning", "markComplete", "markFailed"]) {
    if (typeof orderJobStore?.[method] !== "function") {
      throw workerError("order_job_store_required");
    }
  }
}

function assertAuditService(auditLogService) {
  if (typeof auditLogService?.record !== "function") {
    throw workerError("audit_log_service_required");
  }
}

function assertProvider(orderProvider) {
  if (typeof orderProvider?.submitOrder !== "function") {
    throw workerError("order_provider_required");
  }
}

function assertCredentialService(credentialService) {
  if (typeof credentialService?.getForWorker !== "function") {
    throw workerError("worker_credential_service_required");
  }
}

function assertApprovedJob(job) {
  if (!job || typeof job !== "object") throw workerError("order_job_required");
  if (job.status !== "queued") throw workerError("order_job_not_queued");
  if (!job.jobId) throw workerError("order_job_id_required");
  if (!job.clinicId) throw workerError("clinic_id_required");
  if (!job.orderId) throw workerError("order_id_required");
  if (!job.vendorId) throw workerError("vendor_id_required");
  if (!job.approvedBy || !job.approvedAt) throw workerError("order_job_not_approved");
  if (job.orderStatus && !APPROVED_ORDER_STATUSES.has(job.orderStatus)) {
    throw workerError("order_not_approved_for_worker");
  }
}

function maskErrorText(value) {
  return String(value || "worker_failed")
    .replace(SENSITIVE_WORD_PATTERN, "[redacted]")
    .slice(0, MAX_ERROR_LENGTH);
}

function sanitizeMetadataValue(value) {
  if (typeof value === "string") return maskErrorText(value);
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map(sanitizeMetadataValue);
  if (typeof value === "object") return sanitizeWorkerMetadata(value);
  return maskErrorText(value);
}

function sanitizeWorkerMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};

  return Object.entries(metadata).reduce((safe, [key, value]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      safe[key] = "[redacted]";
      return safe;
    }
    safe[key] = sanitizeMetadataValue(value);
    return safe;
  }, {});
}

function publicJob(job) {
  return {
    jobId: job.jobId,
    clinicId: job.clinicId,
    orderId: job.orderId,
    vendorId: job.vendorId,
    requestedBy: job.requestedBy,
    approvedBy: job.approvedBy,
    approvedAt: job.approvedAt,
    maxOrderAmount: job.maxOrderAmount ?? null,
  };
}

async function recordAudit(auditLogService, job, action, metadata = {}) {
  return auditLogService.record({
    clinicId: job.clinicId,
    actor: { userId: "order-worker", role: "worker" },
    action,
    entity: "order",
    entityId: job.orderId,
    metadata: sanitizeWorkerMetadata({
      jobId: job.jobId,
      vendorId: job.vendorId,
      ...metadata,
    }),
  });
}

export function createOrderJobRunner({
  orderJobStore,
  auditLogService,
  credentialService,
  orderProvider,
  now = () => new Date().toISOString(),
} = {}) {
  assertWorkerStore(orderJobStore);
  assertAuditService(auditLogService);
  assertCredentialService(credentialService);
  assertProvider(orderProvider);

  return Object.freeze({
    async run(job) {
      assertApprovedJob(job);

      await orderJobStore.markRunning({ jobId: job.jobId, startedAt: now() });
      await recordAudit(auditLogService, job, "order.worker.started");

      try {
        const credentials = await credentialService.getForWorker({
          clinicId: job.clinicId,
          vendorId: job.vendorId,
          purpose: "order.worker",
        });

        const result = await orderProvider.submitOrder({
          job: publicJob(job),
          credentials,
        });
        const safeResult = sanitizeWorkerMetadata(result);

        const completed = await orderJobStore.markComplete({
          jobId: job.jobId,
          completedAt: now(),
          result: safeResult,
        });
        await recordAudit(auditLogService, job, "order.worker.completed", {
          result: safeResult,
        });

        return completed;
      } catch (error) {
        const message = maskErrorText(error?.message || error);
        await orderJobStore.markFailed({ jobId: job.jobId, failedAt: now(), error: message });
        await recordAudit(auditLogService, job, "order.worker.failed", {
          error: message,
          errorCode: maskErrorText(error?.code || "worker_failed"),
        });
        throw error;
      }
    },
  });
}

export { maskErrorText, sanitizeWorkerMetadata };
