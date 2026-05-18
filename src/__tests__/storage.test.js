import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

beforeEach(() => {
  storage.clearAll();
});

describe('storage adapter', () => {
  it('save 후 load하면 동일한 값 반환', () => {
    storage.save('foo', { a: 1, b: [2, 3] });
    expect(storage.load('foo', null)).toEqual({ a: 1, b: [2, 3] });
  });

  it('없는 키는 fallback 반환', () => {
    expect(storage.load('missing', 'default')).toBe('default');
  });

  it('remove 후 fallback 반환', () => {
    storage.save('bar', 42);
    storage.remove('bar');
    expect(storage.load('bar', null)).toBeNull();
  });

  it('clearAll은 dentalstock 키만 지움', () => {
    storage.save('x', 1);
    storage.save('y', 2);
    storage.clearAll();
    expect(storage.load('x', null)).toBeNull();
    expect(storage.load('y', null)).toBeNull();
  });

  it('손상된 JSON은 fallback 반환 (예외 없음)', () => {
    window.localStorage.setItem('dentalstock:broken', '{invalid json');
    expect(storage.load('broken', 'safe')).toBe('safe');
  });

  it('ensureVersion: 첫 호출 시 seedFn 실행', () => {
    let calls = 0;
    storage.ensureVersion(() => { calls++; });
    expect(calls).toBe(1);
  });

  it('ensureVersion: 동일 버전이면 seedFn 미실행', () => {
    let calls = 0;
    storage.ensureVersion(() => { calls++; });
    storage.ensureVersion(() => { calls++; });
    expect(calls).toBe(1);
  });
});
