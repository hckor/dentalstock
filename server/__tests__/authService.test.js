import { describe, expect, it } from "vitest";
import {
  createAuthService,
  createStaticBearerAuthProvider,
  readBearerToken,
} from "../authService.js";

function createRequest(headers = {}) {
  return { headers };
}

describe("auth service", () => {
  it("keeps client context headers isolated to test-header mode", async () => {
    const authService = createAuthService({ mode: "test-header" });
    const context = await authService.readRequestContext(createRequest({
      "x-clinic-id": "clinic-test",
      "x-user-id": "u2",
      "x-user-role": "manager",
    }));

    expect(context).toEqual({
      clinicId: "clinic-test",
      userId: "u2",
      role: "manager",
      authMode: "test-header",
    });
  });

  it("falls back safely when production bearer auth is not wired", async () => {
    const authService = createAuthService({ mode: "production" });
    const context = await authService.readRequestContext(createRequest({
      authorization: "Bearer anything",
      "x-clinic-id": "clinic-test",
      "x-user-id": "u2",
      "x-user-role": "manager",
    }));

    expect(context).toEqual({
      clinicId: "demo-clinic",
      userId: "anonymous",
      role: "unknown",
      authMode: "anonymous",
    });
  });

  it("accepts bearer tokens only through the provider interface in production", async () => {
    const provider = createStaticBearerAuthProvider({
      tokens: {
        "valid-token": { clinicId: "clinic-prod", userId: "u1", role: "owner" },
      },
    });
    const authService = createAuthService({ mode: "production", authProvider: provider });
    const context = await authService.readRequestContext(createRequest({
      authorization: "Bearer valid-token",
    }));

    expect(context).toEqual({
      clinicId: "clinic-prod",
      userId: "u1",
      role: "owner",
      authMode: "bearer",
    });
  });

  it("rejects invalid bearer tokens when a provider is configured", async () => {
    const provider = createStaticBearerAuthProvider({
      tokens: {
        "valid-token": { clinicId: "clinic-prod", userId: "u1", role: "owner" },
      },
    });
    const authService = createAuthService({ mode: "production", authProvider: provider });

    await expect(authService.readRequestContext(createRequest({
      authorization: "Bearer invalid-token",
    }))).rejects.toMatchObject({
      message: "invalid_bearer_token",
      statusCode: 401,
    });
  });

  it("requires the internal admin token for internal access", () => {
    const authService = createAuthService({ internalAdminToken: "internal-token" });

    expect(() => authService.assertInternalAccess(createRequest({
      "x-internal-admin-token": "wrong-token",
    }))).toThrow("forbidden");

    expect(() => authService.assertInternalAccess(createRequest({
      "x-internal-admin-token": "internal-token",
    }))).not.toThrow();
  });

  it("parses bearer tokens without accepting other authorization schemes", () => {
    expect(readBearerToken(createRequest({ authorization: "Bearer abc.def" }))).toBe("abc.def");
    expect(readBearerToken(createRequest({ authorization: "Basic abc.def" }))).toBe("");
  });
});
