import { appRepository } from "../repositories/appRepository";

const SENSITIVE_KEY_PATTERN = /(password|credential|token|cookie|session|card|secret|username)/i;
const PIN_KEY_PATTERN = /^(pin|pinCode|pinHash|pin_hash)$/i;

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(key) || PIN_KEY_PATTERN.test(key);
}

function redactSensitiveMetadata(value) {
  if (Array.isArray(value)) return value.map(redactSensitiveMetadata);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((acc, [key, entry]) => {
    acc[key] = isSensitiveKey(key) ? "[redacted]" : redactSensitiveMetadata(entry);
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
