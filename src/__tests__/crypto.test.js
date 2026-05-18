import { describe, it, expect } from 'vitest';
import { hashPin, verifyPinHash, isHashed } from '../utils/crypto';

describe('crypto utility', () => {
  it('hashPin은 pbkdf2 prefix와 4-part 포맷 반환', async () => {
    const h = await hashPin('1234');
    expect(h).toMatch(/^pbkdf2\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(isHashed(h)).toBe(true);
  });

  it('같은 PIN이어도 매번 다른 해시 (salt 효과)', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a).not.toBe(b);
  });

  it('verifyPinHash: 올바른 PIN은 true', async () => {
    const h = await hashPin('1234');
    expect(await verifyPinHash('1234', h)).toBe(true);
  });

  it('verifyPinHash: 잘못된 PIN은 false', async () => {
    const h = await hashPin('1234');
    expect(await verifyPinHash('9999', h)).toBe(false);
  });

  it('verifyPinHash: 평문 PIN 비교(레거시 fallback)도 동작', async () => {
    expect(await verifyPinHash('1234', '1234')).toBe(true);
    expect(await verifyPinHash('1234', '9999')).toBe(false);
  });

  it('isHashed: 평문은 false, 해시는 true', async () => {
    expect(isHashed('1234')).toBe(false);
    expect(isHashed('pbkdf2$100000$abc$def')).toBe(true);
  });
});
