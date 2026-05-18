import { describe, it, expect } from 'vitest';
import {
  getStatus,
  catName,
  pct,
  initials,
  getActiveOrder,
} from '../utils/helpers';

describe('getStatus', () => {
  it('returns "danger" when current_qty is 0 or less', () => {
    expect(getStatus({ current_qty: 0, min_qty: 5 })).toBe('danger');
  });

  it('returns "warning" when current_qty is below min_qty', () => {
    expect(getStatus({ current_qty: 3, min_qty: 5 })).toBe('warning');
  });

  it('returns "ok" when current_qty is at or above min_qty', () => {
    expect(getStatus({ current_qty: 10, min_qty: 5 })).toBe('ok');
  });
});

describe('catName', () => {
  it('returns name of existing category id', () => {
    expect(catName(1)).toBe('소모품');
  });

  it('returns "-" when category id does not exist', () => {
    expect(catName(99)).toBe('-');
  });
});

describe('pct', () => {
  it('calculates percentage correctly', () => {
    expect(pct(50, 100)).toBe(50);
  });

  it('returns 0 when total is 0 (division by zero protection)', () => {
    expect(pct(0, 0)).toBe(0);
  });
});

describe('initials', () => {
  it('returns the first character of a name', () => {
    expect(initials('김원장')).toBe('김');
  });
});

describe('getActiveOrder', () => {
  it('returns the order object when status is pending', () => {
    const orders = [{ item_id: '1', status: 'pending' }];
    expect(getActiveOrder(orders, '1')).toEqual(orders[0]);
  });

  it('returns null when order status is received', () => {
    const orders = [{ item_id: '1', status: 'received' }];
    expect(getActiveOrder(orders, '1')).toBeNull();
  });

  it('returns null when orders list is empty', () => {
    expect(getActiveOrder([], '1')).toBeNull();
  });
});
