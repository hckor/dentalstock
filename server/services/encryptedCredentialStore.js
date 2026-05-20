import { createCipheriv, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function normalizeKey(encryptionKey) {
  if (Buffer.isBuffer(encryptionKey)) {
    return encryptionKey;
  }

  if (encryptionKey instanceof Uint8Array) {
    return Buffer.from(encryptionKey);
  }

  if (typeof encryptionKey !== "string") {
    const error = new Error("credential_encryption_key_required");
    error.statusCode = 500;
    throw error;
  }

  const trimmed = encryptionKey.trim();
  const decoded = /^[a-f0-9]{64}$/i.test(trimmed)
    ? Buffer.from(trimmed, "hex")
    : Buffer.from(trimmed, "base64");

  if (decoded.length === KEY_BYTES) {
    return decoded;
  }

  const utf8 = Buffer.from(trimmed, "utf8");
  if (utf8.length === KEY_BYTES) {
    return utf8;
  }

  const error = new Error("credential_encryption_key_invalid");
  error.statusCode = 500;
  throw error;
}

function normalizeVendorId(vendorId) {
  const normalized = String(vendorId || "").trim();
  if (!normalized) {
    const error = new Error("vendor_id_required");
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function createMemoryCredentialRecordStore(initialRecords = []) {
  const records = new Map(initialRecords);

  return {
    async get(vendorId) {
      const record = records.get(vendorId);
      return record ? { ...record } : null;
    },

    async set(vendorId, record) {
      records.set(vendorId, { ...record });
      return { ...records.get(vendorId) };
    },
  };
}

function toStatus({ vendorId, record, message }) {
  return {
    vendorId,
    connected: Boolean(record),
    stored: Boolean(record),
    mode: "encrypted",
    savedAt: record?.savedAt || null,
    message: message || (record ? "Vendor credential stored." : "Vendor credential not stored."),
  };
}

function encryptCredentials({ key, vendorId, credentials }) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(vendorId, "utf8"));

  const plaintext = JSON.stringify(credentials);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: ALGORITHM,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function createEncryptedCredentialStore({
  encryptionKey,
  credentialRecordStore = createMemoryCredentialRecordStore(),
  now = () => new Date().toISOString(),
} = {}) {
  const key = normalizeKey(encryptionKey);

  return {
    async status({ vendorId }) {
      const normalizedVendorId = normalizeVendorId(vendorId);
      const record = await credentialRecordStore.get(normalizedVendorId);
      return toStatus({ vendorId: normalizedVendorId, record });
    },

    async upsert({ vendorId, username, password }) {
      const normalizedVendorId = normalizeVendorId(vendorId);
      const record = {
        vendorId: normalizedVendorId,
        ...encryptCredentials({
          key,
          vendorId: normalizedVendorId,
          credentials: {
            username: String(username || ""),
            password: String(password || ""),
          },
        }),
        savedAt: now(),
      };

      await credentialRecordStore.set(normalizedVendorId, record);
      return toStatus({
        vendorId: normalizedVendorId,
        record,
        message: "Vendor credential stored.",
      });
    },
  };
}

export { createMemoryCredentialRecordStore };
