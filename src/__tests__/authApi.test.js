import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';
import { authApi, getLockState } from '../api/authApi';
import { usersApi } from '../api/usersApi';
import { INITIAL_USERS } from '../data/initialData';
import { hashPin, isHashed } from '../utils/crypto';

beforeEach(() => {
  storage.clearAll();
  usersApi.save(INITIAL_USERS); // 평문 PIN 상태로 시드
});

describe('authApi (보안 강화)', () => {
  it('올바른 PIN은 ok:true + user 반환', async () => {
    const result = await authApi.verifyPin('u1', '1234');
    expect(result.ok).toBe(true);
    expect(result.user.name).toBe('김원장');
  });

  it('첫 verifyPin 호출 후 PIN이 해시로 마이그레이션됨', async () => {
    await authApi.verifyPin('u1', '1234');
    const users = usersApi.list();
    const owner = users.find(u => u.id === 'u1');
    expect(isHashed(owner.pin)).toBe(true);
    expect(owner.pin).toMatch(/^pbkdf2\$\d+\$/);
  });

  it('잘못된 PIN은 ok:false + reason:"invalid"', async () => {
    const result = await authApi.verifyPin('u1', '9999');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid');
    expect(result.attemptsLeft).toBe(authApi.MAX_ATTEMPTS - 1);
  });

  it('5회 연속 실패 시 잠금', async () => {
    for (let i = 0; i < authApi.MAX_ATTEMPTS; i++) {
      await authApi.verifyPin('u1', '0000');
    }
    const result = await authApi.verifyPin('u1', '1234'); // 맞는 PIN이어도 잠금 상태
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('locked');
    expect(result.remainingMs).toBeGreaterThan(0);
  });

  it('성공하면 시도 카운트가 초기화됨', async () => {
    await authApi.verifyPin('u1', '0000'); // 실패 1회
    await authApi.verifyPin('u1', '1234'); // 성공
    const state = getLockState('u1');
    expect(state.attemptsLeft).toBe(authApi.MAX_ATTEMPTS);
  });

  it('해시화된 PIN을 직접 저장해도 정상 검증', async () => {
    const hashed = await hashPin('5678');
    usersApi.save(INITIAL_USERS.map(u => u.id === 'u1' ? { ...u, pin: hashed } : u));
    const ok = await authApi.verifyPin('u1', '5678');
    expect(ok.ok).toBe(true);
    const ng = await authApi.verifyPin('u1', '1234');
    expect(ng.ok).toBe(false);
  });

  it('비활성 사용자는 PIN이 맞아도 실패', async () => {
    usersApi.save(INITIAL_USERS.map(u => u.id === 'u1' ? { ...u, active: false } : u));
    const result = await authApi.verifyPin('u1', '1234');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_found');
  });

  it('setSession 후 getCurrentUser는 사용자 반환', () => {
    const u = usersApi.list().find(x => x.id === 'u2');
    authApi.setSession(u);
    expect(authApi.getCurrentUser().id).toBe('u2');
  });

  it('만료된 세션은 null 반환 + 자동 정리', () => {
    const u = usersApi.list().find(x => x.id === 'u2');
    // 만료 시간을 과거로 직접 주입
    storage.save('session', { userId: u.id, expiresAt: Date.now() - 1000 });
    expect(authApi.getCurrentUser()).toBeNull();
  });

  it('clearSession 후 getCurrentUser는 null', () => {
    const u = usersApi.list().find(x => x.id === 'u2');
    authApi.setSession(u);
    authApi.clearSession();
    expect(authApi.getCurrentUser()).toBeNull();
  });
});
