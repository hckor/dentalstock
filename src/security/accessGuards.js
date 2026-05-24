import { can } from "../constants/permissions";

export const AUTHORIZATION_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: "authentication_required",
  ACTIVE_PROFILE_REQUIRED: "active_profile_required",
  CLINIC_REQUIRED: "clinic_required",
  CLINIC_ACCESS_DENIED: "clinic_access_denied",
  CAPABILITY_DENIED: "capability_denied",
};

export class AuthorizationError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "AuthorizationError";
    this.code = code;
    this.details = details;
  }
}

export function getActorId(actor) {
  return actor?.supabaseUserId || actor?.userId || actor?.id || null;
}

export function getActorClinicId(actor) {
  return actor?.clinicId || actor?.clinic_id || null;
}

export function getResourceClinicId(resource) {
  if (typeof resource === "string") return resource || null;
  return resource?.clinicId || resource?.clinic_id || null;
}

export function isActiveActor(actor) {
  const activeState = actor?.isActive ?? actor?.is_active ?? actor?.active;
  return activeState !== false && !actor?.disabledAt && !actor?.disabled_at;
}

export function hasClinicAccess(actor, resource) {
  const actorClinicId = getActorClinicId(actor);
  const targetClinicId = getResourceClinicId(resource);
  return Boolean(actorClinicId && targetClinicId && actorClinicId === targetClinicId && isActiveActor(actor));
}

export function canWriteClinicResource(actor, capability, resource) {
  return hasClinicAccess(actor, resource) && can(actor?.role, capability);
}

export function requireClinicWriteCapability(actor, capability, resource) {
  const actorId = getActorId(actor);
  const actorClinicId = getActorClinicId(actor);
  const targetClinicId = getResourceClinicId(resource);
  const role = actor?.role || "";

  if (!actorId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.AUTHENTICATION_REQUIRED, { capability });
  }

  if (!isActiveActor(actor)) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACTIVE_PROFILE_REQUIRED, { actorId, capability });
  }

  if (!actorClinicId || !targetClinicId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.CLINIC_REQUIRED, { actorId, actorClinicId, targetClinicId, capability });
  }

  if (actorClinicId !== targetClinicId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.CLINIC_ACCESS_DENIED, { actorId, actorClinicId, targetClinicId, capability });
  }

  if (!can(role, capability)) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.CAPABILITY_DENIED, { actorId, actorClinicId, targetClinicId, role, capability });
  }

  return {
    actorId,
    actorClinicId,
    targetClinicId,
    role,
    capability,
  };
}
