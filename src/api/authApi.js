import { appRepository } from "../repositories/appRepository";
import { usersApi } from "./usersApi";
import { hashPin, verifyPinHash, isHashed } from "../utils/crypto";

// ─── 보안 설정 ────────────────────────────────────────
const MAX_ATTEMPTS = 5;            // 잠금 전 허용 시도 횟수
const LOCK_DURATION_MS = 60_000;   // 1분 잠금
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

// ─── PIN 해시 마이그레이션 ────────────────────────────
// 동시 호출은 promise 캐시로 합치되, 실제 마이그레이션 필요 여부는 매번 repository 기준으로 확인
let migrationPromise = null;
function migratePinsIfNeeded() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const users = usersApi.list();
    const needsMigration = users.some(u => !isHashed(u.pin));
    if (!needsMigration) return;
    const migrated = await Promise.all(users.map(async u => (
      isHashed(u.pin) ? u : { ...u, pin: await hashPin(u.pin) }
    )));
    usersApi.save(migrated);
  })().finally(() => {
    // 다음 verifyPin 호출 시 다시 검사할 수 있도록 캐시 해제
    // (이미 해시된 경우 needsMigration이 false라 빠르게 종료됨)
    migrationPromise = null;
  });
  return migrationPromise;
}

// ─── 시도 횟수 / 잠금 관리 ────────────────────────────
function readAttempts() {
  return appRepository.authAttempts.get();
}
function writeAttempts(map) {
  appRepository.authAttempts.set(map);
}

export function getLockState(userId) {
  const map = readAttempts();
  const a = map[userId];
  if (!a) return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS };
  const now = Date.now();
  if (a.lockUntil && a.lockUntil > now) {
    return { locked: true, remainingMs: a.lockUntil - now, attemptsLeft: 0 };
  }
  return { locked: false, remainingMs: 0, attemptsLeft: Math.max(0, MAX_ATTEMPTS - (a.count || 0)) };
}

function recordFailure(userId) {
  const map = readAttempts();
  const prev = map[userId] || { count: 0, lockUntil: 0 };
  const count = prev.count + 1;
  const lockUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : 0;
  map[userId] = { count, lockUntil };
  writeAttempts(map);
}

function clearFailures(userId) {
  const map = readAttempts();
  delete map[userId];
  writeAttempts(map);
}

// ─── 세션 ─────────────────────────────────────────────
// { userId, expiresAt }
function readSession() {
  return appRepository.session.get();
}

export const authApi = {
  MAX_ATTEMPTS,
  LOCK_DURATION_MS,
  SESSION_TTL_MS,

  // 마이그레이션이 완료될 때까지 기다린 후 PIN 검증
  async verifyPin(userId, pin) {
    await migratePinsIfNeeded();

    const lock = getLockState(userId);
    if (lock.locked) {
      return { ok: false, reason: "locked", remainingMs: lock.remainingMs };
    }

    const users = usersApi.list();
    const user = users.find(u => u.id === userId && u.active);
    if (!user) {
      return { ok: false, reason: "not_found" };
    }

    const match = await verifyPinHash(pin, user.pin);
    if (!match) {
      recordFailure(userId);
      const after = getLockState(userId);
      return {
        ok: false,
        reason: after.locked ? "locked" : "invalid",
        remainingMs: after.remainingMs,
        attemptsLeft: after.attemptsLeft,
      };
    }

    clearFailures(userId);
    return { ok: true, user };
  },

  getCurrentUser() {
    const session = readSession();
    if (!session || !session.userId) return null;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      appRepository.session.remove();
      return null;
    }
    const users = usersApi.list();
    return users.find(u => u.id === session.userId && u.active) || null;
  },

  setSession(user) {
    appRepository.session.set({
      userId: user.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  },

  clearSession() {
    appRepository.session.remove();
  },

  // 테스트/관리자용
  resetAttempts(userId) {
    clearFailures(userId);
  },
};
