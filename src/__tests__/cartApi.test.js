import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';
import { cartApi } from '../api/cartApi';

beforeEach(() => {
  storage.clearAll();
});

describe('cartApi', () => {
  it('초기 상태에서 list는 빈 배열', () => {
    expect(cartApi.list('u1')).toEqual([]);
  });

  it('save 후 list는 저장된 cart 반환', () => {
    cartApi.save('u1', [{ item_id: '1', qty: 5, note: '급함' }]);
    expect(cartApi.list('u1')).toEqual([{ item_id: '1', qty: 5, note: '급함' }]);
  });

  it('사용자별로 cart 분리됨', () => {
    cartApi.save('u1', [{ item_id: '1', qty: 5, note: '' }]);
    cartApi.save('u2', [{ item_id: '2', qty: 3, note: '' }]);
    expect(cartApi.list('u1')).toHaveLength(1);
    expect(cartApi.list('u2')).toHaveLength(1);
    expect(cartApi.list('u1')[0].item_id).toBe('1');
    expect(cartApi.list('u2')[0].item_id).toBe('2');
  });

  it('clear는 해당 사용자의 cart만 삭제', () => {
    cartApi.save('u1', [{ item_id: '1', qty: 5, note: '' }]);
    cartApi.save('u2', [{ item_id: '2', qty: 3, note: '' }]);
    cartApi.clear('u1');
    expect(cartApi.list('u1')).toEqual([]);
    expect(cartApi.list('u2')).toHaveLength(1);
  });

  it('빈 배열로 save하면 list도 빈 배열', () => {
    cartApi.save('u1', [{ item_id: '1', qty: 5, note: '' }]);
    cartApi.save('u1', []);
    expect(cartApi.list('u1')).toEqual([]);
  });

  it('새로고침 시뮬레이션: save 후 다시 list 호출도 동일 값', () => {
    const items = [{ item_id: '1', qty: 5, note: '' }, { item_id: '2', qty: 3, note: 'memo' }];
    cartApi.save('u1', items);
    expect(cartApi.list('u1')).toEqual(items);
  });
});
