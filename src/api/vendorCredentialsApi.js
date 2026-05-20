import { getApiConfig } from "../config/apiMode";
import { remoteRepository } from "../repositories/remoteRepository";

const DISABLED_MESSAGE = "도매몰 계정 저장소가 아직 서버에 연결되지 않았습니다.";

function normalizeVendorId(vendorId) {
  return String(vendorId || "");
}

function sanitizeCredentialInput(credentials = {}) {
  return {
    username: String(credentials.username || "").trim(),
    password: String(credentials.password || ""),
  };
}

function normalizeStatus(status = {}) {
  return {
    vendorId: normalizeVendorId(status.vendorId),
    connected: Boolean(status.connected),
    mode: status.mode || "disabled",
    stored: Boolean(status.stored),
    savedAt: status.savedAt || null,
    message: status.message || DISABLED_MESSAGE,
  };
}

function disabledStatus(vendorId, message = DISABLED_MESSAGE) {
  return normalizeStatus({
    vendorId,
    connected: false,
    mode: "disabled",
    stored: false,
    message,
  });
}

function toStatusMap(statuses = []) {
  return statuses.reduce((acc, status) => {
    const safeStatus = normalizeStatus(status);
    acc[safeStatus.vendorId] = safeStatus;
    return acc;
  }, {});
}

export const vendorCredentialsApi = {
  disabledStatus,

  statusMapFor(vendors = [], fallbackMessage) {
    return vendors.reduce((acc, vendor) => {
      const vendorId = normalizeVendorId(vendor.id);
      acc[vendorId] = disabledStatus(vendorId, fallbackMessage);
      return acc;
    }, {});
  },

  async loadAll(vendors = []) {
    const vendorIds = vendors.map(vendor => normalizeVendorId(vendor.id)).filter(Boolean);
    if (!getApiConfig().isServerMode) {
      return this.statusMapFor(vendors);
    }

    const statuses = await Promise.all(
      vendorIds.map(async (vendorId) => {
        try {
          return normalizeStatus(await remoteRepository.vendorCredentialStatus(vendorId));
        } catch {
          return disabledStatus(vendorId, "도매몰 계정 상태를 확인할 수 없습니다.");
        }
      }),
    );
    return toStatusMap(statuses);
  },

  async get(vendorId) {
    const id = normalizeVendorId(vendorId);
    if (!getApiConfig().isServerMode) return disabledStatus(id);

    try {
      return normalizeStatus(await remoteRepository.vendorCredentialStatus(id));
    } catch {
      return disabledStatus(id, "도매몰 계정 상태를 확인할 수 없습니다.");
    }
  },

  async save(vendorId, credentials) {
    const id = normalizeVendorId(vendorId);
    const safeCredentials = sanitizeCredentialInput(credentials);
    if (!safeCredentials.username || !safeCredentials.password) {
      return disabledStatus(id, "도매몰 ID와 비밀번호를 모두 입력해 주세요.");
    }
    if (!getApiConfig().isServerMode) {
      return disabledStatus(id);
    }

    try {
      return normalizeStatus(await remoteRepository.saveVendorCredential(id, safeCredentials));
    } catch (error) {
      return disabledStatus(id, error.message || "도매몰 계정을 서버에 저장하지 못했습니다.");
    }
  },

  async saveAll(credentialsByVendor = {}) {
    const entries = Object.entries(credentialsByVendor).filter(([, credentials]) => {
      const safeCredentials = sanitizeCredentialInput(credentials);
      return safeCredentials.username || safeCredentials.password;
    });
    const statuses = await Promise.all(entries.map(([vendorId, credentials]) => this.save(vendorId, credentials)));
    return toStatusMap(statuses);
  },
};
