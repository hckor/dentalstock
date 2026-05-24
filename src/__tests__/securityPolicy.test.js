import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DATA_CLASSIFICATION,
  DATA_SECURITY_POLICY,
  SERVER_ONLY_FIELDS,
  assertNoServerOnlyField,
} from '../security/dataClassification';

describe('security policy', () => {
  it('도매 계정과 세션성 데이터는 server-only로 분류한다', () => {
    expect(DATA_SECURITY_POLICY.auditLogs.classification).toBe(DATA_CLASSIFICATION.CLINIC_INTERNAL);
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

describe('supabase security migrations', () => {
  const initialMigration = readFileSync('supabase/migrations/20260520_initial_dentalstock_schema.sql', 'utf8');
  const hardeningMigration = readFileSync('supabase/migrations/20260521_security_hardening.sql', 'utf8');

  it('핵심 업무 테이블은 RLS가 켜져 있고 clinic 멤버십 조건을 사용한다', () => {
    [
      'clinics',
      'profiles',
      'items',
      'txs',
      'orders',
      'surgeries',
      'notifs',
      'settings',
      'vendor_credentials',
      'audit_logs',
      'order_jobs',
    ].forEach(tableName => {
      expect(initialMigration).toContain(`alter table public.${tableName} enable row level security;`);
    });

    expect(initialMigration).toContain('using (public.is_clinic_member(clinic_id));');
    expect(initialMigration).toContain('using (public.can_manage_clinic(clinic_id))');
    expect(initialMigration).toContain('with check (public.can_manage_clinic(clinic_id));');
  });

  it('도매 자격증명과 서버 작업 테이블은 브라우저 정책을 열지 않는다', () => {
    const policies = initialMigration.match(/create policy[\s\S]*?;/gi) || [];

    expect(initialMigration).toMatch(/vendor_credentials and order_jobs intentionally .*no (browser|client) policies/i);
    expect(policies.some(policy => /on public\.vendor_credentials/i.test(policy))).toBe(false);
    expect(policies.some(policy => /on public\.order_jobs/i.test(policy))).toBe(false);
  });

  it('보안 강화 마이그레이션은 클라이언트 상태 스푸핑과 민감 설정 저장을 막는다', () => {
    expect(hardeningMigration).toContain('create or replace function public.strip_order_app_data_fields');
    expect(hardeningMigration).toContain("- 'status'");
    expect(hardeningMigration).toContain("- 'tracking_number'");
    expect(hardeningMigration).toContain('revoke insert, update, delete on public.audit_logs from authenticated;');
    expect(hardeningMigration).toContain('revoke insert, update, delete on public.notifs from authenticated;');
    expect(hardeningMigration).toContain("then vendor - 'username' - 'password' - 'connected' - 'token' - 'secret'");
    expect(hardeningMigration).toContain("actor_profile.role not in ('owner', 'manager')");
  });
});
