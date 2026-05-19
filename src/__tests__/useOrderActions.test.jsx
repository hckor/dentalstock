import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderActions } from '../hooks/useOrderActions';

describe('useOrderActions', () => {
  let mockSetOrders, mockSetItems, mockSetTxs, mockSetNotifs, mockShowToast, mockSetModal;
  let orders, items, currentUser;

  beforeEach(() => {
    mockSetOrders = vi.fn();
    mockSetItems = vi.fn();
    mockSetTxs = vi.fn();
    mockSetNotifs = vi.fn();
    mockShowToast = vi.fn();
    mockSetModal = vi.fn();

    items = [
      { id: '1', name: '거즈', unit: '박스', current_qty: 10, min_qty: 5 },
      { id: '2', name: '면봉', unit: '상자', current_qty: 20, min_qty: 10 }
    ];

    orders = [
      {
        id: 'o1',
        item_id: '1',
        qty: 5,
        status: 'pending',
        requested_by: '김원장',
        requested_at: '2026-05-01T10:00:00Z'
      }
    ];

    currentUser = { name: '박위생사', role: 'hygienist' };
  });

  it('submitOrder: 새 pending 발주 생성 + 알림', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [], // no active orders
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.submitOrder(items[0], 5, '급함');
    });

    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([]);
    expect(newOrders).toHaveLength(1);
    expect(newOrders[0]).toMatchObject({
      item_id: '1',
      qty: 5,
      note: '급함',
      status: 'pending',
      requested_by: '박위생사',
    });

    expect(mockSetNotifs).toHaveBeenCalledOnce();
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].type).toBe('order_req');
    expect(newNotifs[0].message).toContain('거즈');

    expect(mockShowToast).toHaveBeenCalledWith('거즈 발주 요청 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('submitOrder: 이미 active order가 있으면 토스트만 띄우고 생성 안 함', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [
          {
            id: 'o1',
            item_id: '1',
            qty: 5,
            status: 'pending',
            requested_by: '김원장',
            requested_at: '2026-05-01T10:00:00Z'
          }
        ],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.submitOrder(items[0], 5, '');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('이미 진행 중인 발주가 있습니다.');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('approveOrder: pending 발주 → ordered, reviewed_by 기록, 알림 생성', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders,
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.approveOrder('o1', '승인합니다');
    });

    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(orders);
    const updated = newOrders.find(o => o.id === 'o1');
    expect(updated.status).toBe('ordered');
    expect(updated.reviewed_by).toBe('박위생사');
    expect(updated.review_note).toBe('승인합니다');
    expect(updated.reviewed_at).toBeDefined();

    expect(mockSetNotifs).toHaveBeenCalledOnce();
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].type).toBe('ordered');
    expect(newNotifs[0].message).toContain('거즈');

    expect(mockShowToast).toHaveBeenCalledWith('발주가 승인되었습니다.');
  });

  it('approveOrder: pending이 아니면 토스트만 띄움', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [{ ...orders[0], status: 'ordered' }],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.approveOrder('o1', '승인');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('처리할 발주 요청을 찾을 수 없습니다.');
  });

  it('approveOrder: order_id가 없으면 토스트', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders,
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.approveOrder('nonexistent', '승인');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('처리할 발주 요청을 찾을 수 없습니다.');
  });

  it('rejectOrder: pending 발주 → rejected, review_note 포함, 알림 생성', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders,
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.rejectOrder('o1', '재고 없음');
    });

    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(orders);
    const updated = newOrders.find(o => o.id === 'o1');
    expect(updated.status).toBe('rejected');
    expect(updated.reviewed_by).toBe('박위생사');
    expect(updated.review_note).toBe('재고 없음');

    expect(mockSetNotifs).toHaveBeenCalledOnce();
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].type).toBe('order_rejected');
    expect(newNotifs[0].message).toContain('거즈');
    expect(newNotifs[0].sub).toContain('재고 없음');

    expect(mockShowToast).toHaveBeenCalledWith('발주 요청이 거절되었습니다');
  });

  it('rejectOrder: pending이 아니면 토스트만 띄움', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [{ ...orders[0], status: 'rejected' }],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.rejectOrder('o1', '사유');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('처리할 발주 요청을 찾을 수 없습니다.');
  });

  it('confirmReceipt: ordered 발주 → received, 재고 +actualQty, tx 기록', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [{ ...orders[0], status: 'ordered' }],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.confirmReceipt('o1', 10, '완전함');
    });

    // setItems: 10 + 10 = 20
    expect(mockSetItems).toHaveBeenCalledOnce();
    const itemsUpdater = mockSetItems.mock.calls[0][0];
    const newItems = itemsUpdater(items);
    expect(newItems.find(i => i.id === '1').current_qty).toBe(20);

    // setTxs
    expect(mockSetTxs).toHaveBeenCalledOnce();
    const txsUpdater = mockSetTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs[0].type).toBe('in');
    expect(newTxs[0].qty).toBe(10);
    expect(newTxs[0].note).toContain('발주 입고 확인');
    expect(newTxs[0].note).toContain('완전함');

    // setOrders
    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(orders);
    const updated = newOrders.find(o => o.id === 'o1');
    expect(updated.status).toBe('received');

    // setNotifs
    expect(mockSetNotifs).toHaveBeenCalledOnce();
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].type).toBe('received');

    expect(mockShowToast).toHaveBeenCalledWith('10박스 입고 확인 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('confirmReceipt: ordered가 아니면 토스트만 띄움', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders,
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.confirmReceipt('o1', 10, '');
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('입고 확인할 발주를 찾을 수 없습니다.');
  });

  it('confirmReceipt: item을 찾을 수 없으면 토스트', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [{ ...orders[0], status: 'ordered', item_id: 'nonexistent' }],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.confirmReceipt('o1', 10, '');
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('입고 품목을 찾을 수 없습니다.');
  });

  it('confirmReceipt: note가 없으면 note 필드에 포함 안 됨', () => {
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [{ ...orders[0], status: 'ordered' }],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.confirmReceipt('o1', 10, '');
    });

    const txsUpdater = mockSetTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs[0].note).toBe('발주 입고 확인 (요청자: 김원장)');
  });
});
