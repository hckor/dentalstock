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
  const hardeningMigration = readFileSync('supabase/migrations/20260523_security_hardening.sql', 'utf8');
  const staffDeleteMigration = readFileSync('supabase/migrations/20260526_staff_delete_profile.sql', 'utf8');
  const createPolicies = initialMigration.match(/create policy[\s\S]*?;/gi) || [];

  function policiesFor(tableName) {
    const tablePattern = new RegExp(`on\\s+public\\.${tableName}\\b`, 'i');
    return createPolicies.filter(policy => tablePattern.test(policy));
  }

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

  it('브라우저 정책은 clinic 멤버십/관리자 조건으로 병원 간 데이터를 격리한다', () => {
    [
      'clinics',
      'profiles',
      'items',
      'txs',
      'orders',
      'surgeries',
      'notifs',
      'settings',
      'audit_logs',
    ].forEach(tableName => {
      const tablePolicies = policiesFor(tableName);
      expect(tablePolicies.length).toBeGreaterThan(0);
      tablePolicies.forEach(policy => {
        expect(policy).toMatch(/public\.(is_clinic_member|can_manage_clinic|is_clinic_owner)\((clinic_id|id)\)/i);
      });
    });

    expect(initialMigration).toMatch(/where id = auth\.uid\(\)\s+and clinic_id = target_clinic_id\s+and is_active = true/i);
    expect(initialMigration).toMatch(/where id = auth\.uid\(\)\s+and clinic_id = target_clinic_id\s+and role in \('owner', 'manager'\)\s+and is_active = true/i);
  });

  it('쓰기 정책은 same-clinic 소유권과 역할별 관리 권한을 요구한다', () => {
    expect(initialMigration).toMatch(/create policy "owners can update clinic profiles"[\s\S]*using \(public\.is_clinic_owner\(clinic_id\)\)[\s\S]*with check \(public\.is_clinic_owner\(clinic_id\)\);/i);
    expect(initialMigration).toMatch(/create policy "members can create stock transactions"[\s\S]*public\.is_clinic_member\(clinic_id\)[\s\S]*and actor_id = auth\.uid\(\)/i);
    expect(initialMigration).toMatch(/create policy "members can create orders"[\s\S]*public\.is_clinic_member\(clinic_id\)[\s\S]*and requested_by = auth\.uid\(\)[\s\S]*and status = 'pending'/i);

    [
      ['items', 'create items'],
      ['items', 'update items'],
      ['orders', 'update orders'],
      ['surgeries', 'create surgeries'],
      ['surgeries', 'update surgeries'],
      ['settings', 'create settings'],
      ['settings', 'update settings'],
    ].forEach(([tableName, policyName]) => {
      expect(policiesFor(tableName).some(policy =>
        policy.toLowerCase().includes(policyName) &&
        /public\.can_manage_clinic\(clinic_id\)/i.test(policy)
      )).toBe(true);
    });
  });

  it('도매 자격증명과 서버 작업 테이블은 브라우저 정책을 열지 않는다', () => {
    expect(initialMigration).toMatch(/vendor_credentials and order_jobs intentionally .*no (browser|client) policies/i);
    expect(createPolicies.some(policy => /on public\.vendor_credentials/i.test(policy))).toBe(false);
    expect(createPolicies.some(policy => /on public\.order_jobs/i.test(policy))).toBe(false);
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

  it('직원 삭제는 owner 전용 RPC와 감사 로그를 사용한다', () => {
    expect(staffDeleteMigration).toContain('create or replace function public.delete_staff_profile');
    expect(staffDeleteMigration).toMatch(/role = 'owner'/i);
    expect(staffDeleteMigration).not.toMatch(/role\s+in\s+\('owner',\s*'manager'\)/i);
    expect(staffDeleteMigration).toContain('Only an active owner can delete staff profiles');
    expect(staffDeleteMigration).toContain('Owners cannot delete their own profile');
    expect(staffDeleteMigration).toContain('Cannot delete the last active owner');
    expect(staffDeleteMigration).toContain("'staff.deleted'");
    expect(staffDeleteMigration).toContain('grant execute on function public.delete_staff_profile(uuid) to authenticated;');
  });
});
