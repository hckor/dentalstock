import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';
import { itemsApi } from '../api/itemsApi';
import { ordersApi } from '../api/ordersApi';
import { seedIfEmpty, resetToInitial } from '../api/seed';
import { INIT_ITEMS, INIT_ORDERS } from '../data/initialData';

beforeEach(() => {
  storage.clearAll();
});

describe('영속화 (persistence)', () => {
  it('seedIfEmpty가 비어있는 저장소에 초기 데이터를 채움', () => {
    seedIfEmpty();
    expect(itemsApi.list().length).toBe(INIT_ITEMS.length);
    expect(ordersApi.list().length).toBe(INIT_ORDERS.length);
  });

  it('save 후 list는 저장된 값을 반환', () => {
    const modified = [{ id: 'x1', name: '테스트 품목', category_id: 1, unit: '개', current_qty: 5, min_qty: 2, location: '시험소', expiry: null }];
    itemsApi.save(modified);
    expect(itemsApi.list()).toEqual(modified);
  });

  it('새로고침 시뮬레이션: 저장 후 새 API 호출도 같은 값 반환', () => {
    const next = [...INIT_ITEMS, { id: 'new', name: '새 품목', category_id: 1, unit: '개', current_qty: 1, min_qty: 1, location: 'X', expiry: null }];
    itemsApi.save(next);
    // 시뮬레이션: 모듈을 다시 import하지 않아도 storage가 영속화되었으므로 list 호출 시 동일 결과
    expect(itemsApi.list().length).toBe(INIT_ITEMS.length + 1);
    expect(itemsApi.list().find(i => i.id === 'new').name).toBe('새 품목');
  });

  it('resetToInitial은 모든 변경을 초기 데이터로 되돌림', () => {
    itemsApi.save([]); // 모두 삭제
    expect(itemsApi.list()).toEqual([]);
    resetToInitial();
    expect(itemsApi.list().length).toBe(INIT_ITEMS.length);
  });
});
