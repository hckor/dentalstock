import { describe, expect, it } from "vitest";
import { ROLE_CAPABILITIES } from "../constants/permissions";
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  canWriteClinicResource,
  requireClinicWriteCapability,
} from "../security/accessGuards";

const C = ROLE_CAPABILITIES;
const ERR = AUTHORIZATION_ERROR_CODES;

function expectDenied(fn, code) {
  let error;
  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  expect(error).toBeInstanceOf(AuthorizationError);
  expect(error.code).toBe(code);
}

describe("security access guards", () => {
  const manager = { id: "u-manager", role: "manager", clinicId: "clinic-a", isActive: true };
  const owner = { id: "u-owner", role: "owner", clinicId: "clinic-a", isActive: true };
  const hygienist = { id: "u-hygienist", role: "hygienist", clinicId: "clinic-a", isActive: true };
  const staff = { id: "u-staff", role: "staff", clinicId: "clinic-a", isActive: true };
  const clinicAItem = { id: "item-1", clinic_id: "clinic-a" };

  it("permits same-clinic writes only when the role has the write capability", () => {
    expect(requireClinicWriteCapability(owner, C.MANAGE_STAFF, { clinicId: "clinic-a" })).toMatchObject({
      actorId: "u-owner",
      targetClinicId: "clinic-a",
      capability: C.MANAGE_STAFF,
    });

    expect(requireClinicWriteCapability(manager, C.MANAGE_INVENTORY, clinicAItem)).toMatchObject({
      actorId: "u-manager",
      actorClinicId: "clinic-a",
      targetClinicId: "clinic-a",
      capability: C.MANAGE_INVENTORY,
    });

    expect(canWriteClinicResource(manager, C.MANAGE_ORDER, { clinic_id: "clinic-a" })).toBe(true);
  });

  it("shows why hiding a button is not enough: the server/API guard rejects unauthorized writes", () => {
    expect(canWriteClinicResource(hygienist, C.MANAGE_ORDER, clinicAItem)).toBe(false);
    expectDenied(
      () => requireClinicWriteCapability(hygienist, C.MANAGE_ORDER, clinicAItem),
      ERR.CAPABILITY_DENIED
    );

    expect(canWriteClinicResource(manager, C.MANAGE_STAFF, { clinic_id: "clinic-a" })).toBe(true);
  });

  it("rejects cross-clinic writes even for powerful roles", () => {
    const otherClinicItem = { id: "item-2", clinic_id: "clinic-b" };

    expect(canWriteClinicResource(owner, C.MANAGE_INVENTORY, otherClinicItem)).toBe(false);
    expectDenied(
      () => requireClinicWriteCapability(owner, C.MANAGE_INVENTORY, otherClinicItem),
      ERR.CLINIC_ACCESS_DENIED
    );
  });

  it("requires an active authenticated actor and a target clinic", () => {
    expectDenied(
      () => requireClinicWriteCapability(null, C.MANAGE_INVENTORY, clinicAItem),
      ERR.AUTHENTICATION_REQUIRED
    );
    expectDenied(
      () => requireClinicWriteCapability({ ...owner, isActive: false }, C.MANAGE_INVENTORY, clinicAItem),
      ERR.ACTIVE_PROFILE_REQUIRED
    );
    expectDenied(
      () => requireClinicWriteCapability(owner, C.MANAGE_INVENTORY, { id: "missing-clinic" }),
      ERR.CLINIC_REQUIRED
    );
  });

  it("allows staff to confirm surgery prep without granting broader prep management", () => {
    expect(requireClinicWriteCapability(staff, C.CONFIRM_SURGERY_PREP, { clinicId: "clinic-a" })).toMatchObject({
      actorId: "u-staff",
      capability: C.CONFIRM_SURGERY_PREP,
    });

    expectDenied(
      () => requireClinicWriteCapability(staff, C.MANAGE_SURGERY_PREP, { clinicId: "clinic-a" }),
      ERR.CAPABILITY_DENIED
    );
  });
});
