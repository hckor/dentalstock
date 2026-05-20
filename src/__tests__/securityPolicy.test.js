import { describe, it, expect } from 'vitest';
import {
  DATA_CLASSIFICATION,
  DATA_SECURITY_POLICY,
  SERVER_ONLY_FIELDS,
  assertNoServerOnlyField,
} from '../security/dataClassification';

describe('security policy', () => {
  it('도매 계정과 세션성 데이터는 server-only로 분류한다', () => {
    expect(DATA_SECURITY_POLICY.vendorCredentials.classification).toBe(DATA_CLASSIFICATION.SECRET);
    expect(DATA_SECURITY_POLICY.session.classification).toBe(DATA_CLASSIFICATION.SECRET);
    expect(SERVER_ONLY_FIELDS).toContain('vendors.username');
    expect(SERVER_ONLY_FIELDS).toContain('vendors.password');
    expect(SERVER_ONLY_FIELDS).toContain('session');
    expect(SERVER_ONLY_FIELDS).toContain('authAttempts');
  });

  it('server-only 필드는 클라이언트 저장 가능 필드로 통과하지 않는다', () => {
    expect(assertNoServerOnlyField('items.name')).toBe(true);
    expect(assertNoServerOnlyField('orders.trackingNumber')).toBe(true);
    expect(assertNoServerOnlyField('vendors.username')).toBe(false);
    expect(assertNoServerOnlyField('vendors.password')).toBe(false);
    expect(assertNoServerOnlyField('vendorCredentials.usernameCiphertext')).toBe(false);
    expect(assertNoServerOnlyField('vendorCredentials.passwordCiphertext')).toBe(false);
    expect(assertNoServerOnlyField('session.expiresAt')).toBe(false);
  });
});
