const SENSITIVE_KEY_PATTERN = /(password|passwd|secret|token|session|cookie|pin|card|credential)/i;
const MAX_METADATA_KEYS = 50;
const MAX_STRING_LENGTH = 500;

function assertRequiredString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error(`${field}_required`);
    error.statusCode = 400;
    throw error;
  }
}

function sanitizeValue(value) {
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === "number" || typeof value === "boolean" || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map(sanitizeValue);
  if (typeof value === "object") return sanitizeMetadata(value);
  return String(value).slice(0, MAX_STRING_LENGTH);
}

export function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};

  return Object.entries(metadata)
    .slice(0, MAX_METADATA_KEYS)
    .reduce((safe, [key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        safe[key] = "[redacted]";
        return safe;
      }
      safe[key] = sanitizeValue(value);
      return safe;
    }, {});
}

export function createAuditLogService({ auditLogStore, now = () => new Date().toISOString() } = {}) {
  if (!auditLogStore || typeof auditLogStore.create !== "function") {
    throw new Error("audit_log_store_required");
  }

  const service = {
    async record({ clinicId, actor, action, entity, entityId, metadata = {}, requestId } = {}) {
      assertRequiredString(clinicId, "clinic_id");
      assertRequiredString(action, "action");
      assertRequiredString(entity, "entity");
      assertRequiredString(entityId, "entity_id");

      const actorId = actor?.userId || actor?.id || "system";
      const actorRole = actor?.role || "system";

      return auditLogStore.create({
        clinicId,
        action,
        entity,
        entityId,
        actor: {
          userId: actorId,
          role: actorRole,
        },
        metadata: sanitizeMetadata(metadata),
        requestId: typeof requestId === "string" ? requestId.slice(0, 120) : undefined,
        createdAt: now(),
      });
    },

    async listByClinic({ clinicId, limit } = {}) {
      assertRequiredString(clinicId, "clinic_id");
      return auditLogStore.listByClinic({ clinicId, limit });
    },
  };

  return Object.freeze(service);
}
