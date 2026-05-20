import { describe, expect, it } from "vitest";
import {
  createEncryptedCredentialStore,
  createMemoryCredentialRecordStore,
} from "../services/encryptedCredentialStore.js";
import { createVendorCredentialService } from "../services/vendorCredentialService.js";

const ENCRYPTION_KEY = "12345678901234567890123456789012";
const SAVED_AT = "2026-05-20T00:00:00.000Z";

describe("vendor credential service", () => {
  it("stores credentials with AES-256-GCM and returns storage status only", async () => {
    let persistedRecord = null;
    const credentialRecordStore = {
      async get(vendorId) {
        return persistedRecord && persistedRecord.vendorId === vendorId ? { ...persistedRecord } : null;
      },
      async set(vendorId, record) {
        persistedRecord = { ...record, vendorId };
        return { ...persistedRecord };
      },
    };
    const credentialStore = createEncryptedCredentialStore({
      encryptionKey: ENCRYPTION_KEY,
      credentialRecordStore,
      now: () => SAVED_AT,
    });

    const upsertResult = await credentialStore.upsert({
      vendorId: "vendor-a",
      username: "vendor-user",
      password: "super-secret-password",
    });

    expect(upsertResult).toEqual({
      vendorId: "vendor-a",
      connected: true,
      stored: true,
      mode: "encrypted",
      savedAt: SAVED_AT,
      message: "Vendor credential stored.",
    });
    expect(persistedRecord).toMatchObject({
      vendorId: "vendor-a",
      algorithm: "aes-256-gcm",
      savedAt: SAVED_AT,
    });
    expect(persistedRecord.iv).toEqual(expect.any(String));
    expect(persistedRecord.authTag).toEqual(expect.any(String));
    expect(persistedRecord.ciphertext).toEqual(expect.any(String));
    expect(JSON.stringify(persistedRecord)).not.toContain("vendor-user");
    expect(JSON.stringify(persistedRecord)).not.toContain("super-secret-password");

    const status = await credentialStore.status({ vendorId: "vendor-a" });
    expect(status).toEqual(upsertResult);
    expect(status.username).toBeUndefined();
    expect(status.password).toBeUndefined();
  });

  it("sanitizes status and upsert responses from the backing credential store", async () => {
    const credentialStore = {
      async status({ vendorId }) {
        return {
          vendorId,
          connected: true,
          stored: true,
          mode: "encrypted",
          savedAt: SAVED_AT,
          message: "stored",
          username: "leaky-user",
          password: "leaky-password",
        };
      },
      async upsert({ vendorId }) {
        return {
          vendorId,
          connected: true,
          stored: true,
          mode: "encrypted",
          savedAt: SAVED_AT,
          message: "stored",
          username: "leaky-user",
          password: "leaky-password",
        };
      },
    };
    const service = createVendorCredentialService({
      internalAdminToken: "internal-token",
      credentialStore,
    });

    await expect(service.status({ vendorId: "vendor-a" })).resolves.toEqual({
      vendorId: "vendor-a",
      connected: true,
      stored: true,
      mode: "encrypted",
      savedAt: SAVED_AT,
      message: "stored",
    });
    await expect(
      service.upsert({
        vendorId: "vendor-a",
        credentials: { username: "vendor-user", password: "super-secret-password" },
      }),
    ).resolves.toEqual({
      vendorId: "vendor-a",
      connected: true,
      stored: true,
      mode: "encrypted",
      savedAt: SAVED_AT,
      message: "stored",
    });
  });

  it("exposes only stored state through the service when encrypted storage is configured", async () => {
    const credentialStore = createEncryptedCredentialStore({
      encryptionKey: ENCRYPTION_KEY,
      credentialRecordStore: createMemoryCredentialRecordStore(),
      now: () => SAVED_AT,
    });
    const service = createVendorCredentialService({
      internalAdminToken: "internal-token",
      credentialStore,
    });

    const result = await service.upsert({
      vendorId: "vendor-a",
      credentials: { username: "vendor-user", password: "super-secret-password" },
    });

    expect(result).toEqual({
      vendorId: "vendor-a",
      connected: true,
      stored: true,
      mode: "encrypted",
      savedAt: SAVED_AT,
      message: "Vendor credential stored.",
    });
    expect(result.username).toBeUndefined();
    expect(result.password).toBeUndefined();

    const status = await service.status({ vendorId: "vendor-a" });
    expect(status).toEqual(result);
    expect(status.username).toBeUndefined();
    expect(status.password).toBeUndefined();
  });
});
