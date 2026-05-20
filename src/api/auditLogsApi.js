import { appRepository } from "../repositories/appRepository";

const SENSITIVE_KEY_PATTERN = /(password|credential|token|cookie|session|pin|card|secret|username)/i;

function redactSensitiveMetadata(value) {
  if (Array.isArray(value)) return value.map(redactSensitiveMetadata);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((acc, [key, entry]) => {
    acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : redactSensitiveMetadata(entry);
    return acc;
  }, {});
}

function normalizeActor(actor) {
  if (!actor) return { userId: null, name: "system", role: "system" };
  return {
    userId: actor.id ?? null,
    name: actor.name || "unknown",
    role: actor.role || "unknown",
  };
}

export const auditLogsApi = {
  list() {
    return appRepository.auditLogs.list();
  },

  save(logs) {
    appRepository.auditLogs.save(logs);
  },

  record({ action, entityType, entityId, actor, metadata = {}, at = new Date().toISOString() }) {
    const log = {
      id: `a${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      actor: normalizeActor(actor),
      metadata: redactSensitiveMetadata(metadata),
      created_at: at,
    };

    appRepository.auditLogs.save([log, ...this.list()]);
    return log;
  },
};
