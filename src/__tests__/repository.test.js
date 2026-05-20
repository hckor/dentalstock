import { describe, it, expect, beforeEach } from 'vitest';
import { STORAGE_KEYS } from '../api/keys';
import { INIT_ITEMS, INIT_ORDERS, INITIAL_USERS } from '../data/initialData';
import { appRepository } from '../repositories/appRepository';
import { createCollectionRepository, createValueRepository, localRepository } from '../repositories/localRepository';

beforeEach(() => {
  localRepository.clearAll();
});

describe('data repositories', () => {
  it('collection repository는 list/save 인터페이스로 데이터를 읽고 쓴다', () => {
    const repo = createCollectionRepository('test_items', []);
    const records = [{ id: 'i-test', name: '테스트 품목' }];

    expect(repo.list()).toEqual([]);
    repo.save(records);
    expect(repo.list()).toEqual(records);
  });

  it('value repository는 get/set/remove 인터페이스로 단일 값을 관리한다', () => {
    const repo = createValueRepository('test_value', null);

    expect(repo.get()).toBeNull();
    repo.set({ enabled: true });
    expect(repo.get()).toEqual({ enabled: true });
    repo.remove();
    expect(repo.get()).toBeNull();
  });

  it('appRepository.resetToInitial은 앱 도메인 데이터를 초기 상태로 복구한다', () => {
    appRepository.items.save([]);
    appRepository.orders.save([]);
    appRepository.users.save([]);

    appRepository.resetToInitial();

    expect(appRepository.items.list()).toHaveLength(INIT_ITEMS.length);
    expect(appRepository.orders.list()).toHaveLength(INIT_ORDERS.length);
    expect(appRepository.users.list()).toHaveLength(INITIAL_USERS.length);
  });

  it('appRepository.seedIfEmpty는 버전 관리된 초기 데이터를 채운다', () => {
    appRepository.seedIfEmpty();

    expect(appRepository.items.list()).toHaveLength(INIT_ITEMS.length);
    expect(appRepository.orders.list()).toHaveLength(INIT_ORDERS.length);
  });

  it('session/settings/authAttempts는 도메인 키를 통해 접근한다', () => {
    appRepository.session.set({ userId: 'u1' });
    appRepository.settings.set({ maxOrderAmount: '10000' });
    appRepository.authAttempts.set({ u1: { count: 1 } });

    expect(localRepository.read(STORAGE_KEYS.session, null)).toEqual({ userId: 'u1' });
    expect(localRepository.read(STORAGE_KEYS.settings, null)).toEqual({ maxOrderAmount: '10000' });
    expect(localRepository.read(STORAGE_KEYS.authAttempts, null)).toEqual({ u1: { count: 1 } });
  });
});
