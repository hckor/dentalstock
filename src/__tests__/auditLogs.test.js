import { describe, it, expect, beforeEach } from 'vitest';
import { auditLogsApi } from '../api/auditLogsApi';
import { localRepository, DEFAULT_CLINIC_ID, setActiveClinicId } from '../repositories/localRepository';

beforeEach(() => {
  setActiveClinicId(DEFAULT_CLINIC_ID);
  localRepository.clearAll();
});

describe('auditLogsApi', () => {
  it('업무 변경 이벤트를 최신순으로 기록한다', () => {
    const actor = { id: 'u1', name: '김원장', role: 'owner' };

    auditLogsApi.record({
      action: 'stock.in',
      entityType: 'item',
      entityId: 'i1',
      actor,
      metadata: { qty: 3, before_qty: 1, after_qty: 4 },
      at: '2026-05-20T01:00:00.000Z',
    });
    auditLogsApi.record({
      action: 'order.approved',
      entityType: 'order',
      entityId: 'o1',
      actor,
      metadata: { qty: 2 },
      at: '2026-05-20T02:00:00.000Z',
    });

    const logs = auditLogsApi.list();

    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      action: 'order.approved',
      entity_type: 'order',
      entity_id: 'o1',
      actor: { userId: 'u1', name: '김원장', role: 'owner' },
      metadata: { qty: 2 },
    });
  });

  it('민감한 metadata 키는 로그 저장 전에 마스킹한다', () => {
    auditLogsApi.record({
      action: 'vendor.credentials_updated',
      entityType: 'vendor',
      entityId: '1',
      actor: { name: '김원장', role: 'owner' },
      metadata: {
        username: 'demo-user',
        password: 'secret',
        nested: {
          sessionToken: 'token',
          visible: 'ok',
        },
        shipping_status: '배달완료',
      },
    });

    expect(auditLogsApi.list()[0].metadata).toEqual({
      username: '[redacted]',
      password: '[redacted]',
      nested: {
        sessionToken: '[redacted]',
        visible: 'ok',
      },
      shipping_status: '배달완료',
    });
  });
});
