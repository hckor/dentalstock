import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderActions } from '../hooks/useOrderActions';
import { settingsApi } from '../api/settingsApi';

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

    currentUser = { name: '이매니저', role: 'manager' };
    settingsApi.save({
      vendors: [
        { id: 1, name: '덴올', automaticOrdering: true },
        { id: 2, name: '오스템몰', automaticOrdering: true },
        { id: 3, name: '이덴트', automaticOrdering: false },
      ],
      preferredVendor: 'lowest',
      maxOrderAmount: '50000',
    });
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
      requested_by: '이매니저',
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

  it('submitBulkOrders: 부족 품목 여러 건을 pending 발주로 한 번에 생성', () => {
    const bulkItems = [
      { id: '2', name: '면봉', unit: '상자', current_qty: 2, min_qty: 10 },
      { id: '3', name: '마스크', unit: '박스', current_qty: 0, min_qty: 5 },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [],
        setOrders: mockSetOrders,
        items: [...items, ...bulkItems],
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.submitBulkOrders([
        { item: bulkItems[0], qty: 8 },
        { item: bulkItems[1], qty: 5 },
      ], '부족 품목 일괄 발주');
    });

    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([]);
    expect(newOrders).toHaveLength(2);
    expect(newOrders[0]).toMatchObject({ item_id: '2', qty: 8, status: 'pending', note: '부족 품목 일괄 발주' });
    expect(newOrders[1]).toMatchObject({ item_id: '3', qty: 5, status: 'pending', note: '부족 품목 일괄 발주' });

    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0]).toMatchObject({
      type: 'order_req',
      message: '부족 품목 2건 발주 요청이 도착했습니다',
    });
    expect(mockShowToast).toHaveBeenCalledWith('2건 발주 요청 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('submitBulkOrders: 이미 발주 중인 품목은 제외', () => {
    const activeItem = items[0];
    const availableItem = { id: '3', name: '마스크', unit: '박스', current_qty: 0, min_qty: 5 };
    const { result } = renderHook(() =>
      useOrderActions({
        orders,
        setOrders: mockSetOrders,
        items: [...items, availableItem],
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.submitBulkOrders([
        { item: activeItem, qty: 5 },
        { item: availableItem, qty: 5 },
      ], '');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(orders);
    expect(newOrders[0]).toMatchObject({ item_id: '3', qty: 5, status: 'pending' });
    expect(newOrders.filter(order => order.item_id === '1')).toHaveLength(1);
    expect(mockShowToast).toHaveBeenCalledWith('1건 발주 요청 완료 · 1건 제외');
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
    expect(updated.reviewed_by).toBe('이매니저');
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

  it('approveOrders: 선택한 pending 발주를 한 번에 ordered로 변경', () => {
    const bulkOrders = [
      orders[0],
      {
        id: 'o2',
        item_id: '2',
        qty: 3,
        status: 'pending',
        requested_by: '박위생사',
        requested_at: '2026-05-01T11:00:00Z',
      },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: bulkOrders,
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
      result.current.approveOrders(['o1', 'o2'], '일괄 승인');
    });

    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(bulkOrders);
    expect(newOrders.every(order => order.status === 'ordered')).toBe(true);
    expect(newOrders[0].review_note).toBe('일괄 승인');
    expect(newOrders[1].reviewed_by).toBe('이매니저');
    expect(newOrders[0].shipment_group_id).toBeDefined();
    expect(newOrders[1].shipment_group_id).toBe(newOrders[0].shipment_group_id);

    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0]).toMatchObject({
      type: 'ordered',
      message: '발주 2건이 승인되었습니다',
      sub: '1개 거래처로 나눠 배송',
    });
    expect(mockShowToast).toHaveBeenCalledWith('2건 일괄 승인 완료');
  });

  it('approveOrders: 선택된 pending 발주가 없으면 토스트만 표시', () => {
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
      result.current.approveOrders(['o1'], '일괄 승인');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockSetNotifs).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('승인할 발주 요청이 없습니다');
  });

  it('approveOrders: 최저가 거래처가 다르면 배송 묶음을 거래처별로 나눈다', () => {
    const vendorItems = [
      {
        id: '1',
        name: '거즈',
        unit: '박스',
        current_qty: 10,
        min_qty: 5,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 1000 },
          { vendor_id: 2, vendor_name: '오스템몰', price: 1200 },
        ],
      },
      {
        id: '2',
        name: '면봉',
        unit: '상자',
        current_qty: 20,
        min_qty: 10,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 2200 },
          { vendor_id: 2, vendor_name: '오스템몰', price: 1800 },
        ],
      },
      {
        id: '3',
        name: '마스크',
        unit: '박스',
        current_qty: 0,
        min_qty: 5,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 900 },
          { vendor_id: 2, vendor_name: '오스템몰', price: 1100 },
        ],
      },
    ];
    const bulkOrders = [
      { ...orders[0], id: 'o1', item_id: '1', status: 'pending' },
      { ...orders[0], id: 'o2', item_id: '2', status: 'pending' },
      { ...orders[0], id: 'o3', item_id: '3', status: 'pending' },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: bulkOrders,
        setOrders: mockSetOrders,
        items: vendorItems,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.approveOrders(['o1', 'o2', 'o3'], '일괄 승인');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(bulkOrders);
    expect(newOrders.find(order => order.id === 'o1')).toMatchObject({ vendor_id: '1', vendor_name: '덴올' });
    expect(newOrders.find(order => order.id === 'o2')).toMatchObject({ vendor_id: '2', vendor_name: '오스템몰', shipment_group_id: undefined });
    expect(newOrders.find(order => order.id === 'o3').shipment_group_id).toBe(newOrders.find(order => order.id === 'o1').shipment_group_id);
    expect(newOrders.find(order => order.id === 'o1').shipment_group_id).toBeDefined();
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
    expect(updated.reviewed_by).toBe('이매니저');
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

  it('confirmReceipt: 일부만 입고되면 ordered 상태로 남기고 누적 입고 수량을 저장', () => {
    const orderedOrder = { ...orders[0], status: 'ordered', qty: 10 };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [orderedOrder],
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
      result.current.confirmReceipt('o1', 4, '나머지 대기');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([orderedOrder]);
    expect(newOrders[0]).toMatchObject({
      status: 'ordered',
      received_qty: 4,
    });
    expect(newOrders[0].shipping_events[0].status).toBe('부분입고');
    expect(mockShowToast).toHaveBeenCalledWith('4박스 부분 입고 확인');
  });

  it('confirmReceipts: 묶음 배송 실입고 수량을 한 번에 재고와 주문에 반영', () => {
    const bulkOrders = [
      { ...orders[0], id: 'o1', item_id: '1', qty: 5, status: 'ordered', requested_by: '김원장', shipment_group_id: 'sg1' },
      { ...orders[0], id: 'o2', item_id: '2', qty: 8, status: 'ordered', requested_by: '박원장', shipment_group_id: 'sg1' },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: bulkOrders,
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
      result.current.confirmReceipts([
        { orderId: 'o1', actualQty: 5 },
        { orderId: 'o2', actualQty: 9 },
      ], '수량 확인 완료');
    });

    const itemsUpdater = mockSetItems.mock.calls[0][0];
    const newItems = itemsUpdater(items);
    expect(newItems.find(i => i.id === '1').current_qty).toBe(15);
    expect(newItems.find(i => i.id === '2').current_qty).toBe(29);

    const txsUpdater = mockSetTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs).toHaveLength(2);
    expect(newTxs.map(tx => tx.qty)).toEqual([5, 9]);
    expect(newTxs[0].note).toContain('묶음 배송 입고 확인');
    expect(newTxs[0].note).toContain('수량 확인 완료');

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(bulkOrders);
    expect(newOrders.every(order => order.status === 'received')).toBe(true);
    expect(newOrders.every(order => Array.isArray(order.shipping_events))).toBe(true);

    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].message).toBe('묶음 배송 2건 입고 확인 완료');
    expect(mockShowToast).toHaveBeenCalledWith('2건 입고 수량 확인 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('confirmReceipts: 유효한 배송건이 없으면 토스트만 띄움', () => {
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
      result.current.confirmReceipts([{ orderId: 'o1', actualQty: 5 }], '');
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('입고 확인할 배송건이 없습니다');
  });

  it('confirmReceipts: 묶음 중 일부 품목이 부족 입고되면 해당 주문은 진행중에 남긴다', () => {
    const bulkOrders = [
      { ...orders[0], id: 'o1', item_id: '1', qty: 5, status: 'ordered', requested_by: '김원장', shipment_group_id: 'sg1' },
      { ...orders[0], id: 'o2', item_id: '2', qty: 8, status: 'ordered', requested_by: '박원장', shipment_group_id: 'sg1' },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: bulkOrders,
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
      result.current.confirmReceipts([
        { orderId: 'o1', actualQty: 3 },
        { orderId: 'o2', actualQty: 8 },
      ], '');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(bulkOrders);
    expect(newOrders.find(order => order.id === 'o1')).toMatchObject({ status: 'ordered', received_qty: 3 });
    expect(newOrders.find(order => order.id === 'o2')).toMatchObject({ status: 'received', received_qty: 8 });
    expect(mockShowToast).toHaveBeenCalledWith('완료 1건 · 부분입고 1건');
  });

  it('startTracking: 송장 등록 시 shipping_events 초기 데이터를 저장', () => {
    const orderedOrder = {
      ...orders[0],
      status: 'ordered',
      reviewed_at: '2026-05-01T11:00:00Z',
    };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [orderedOrder],
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
      result.current.startTracking('o1', 'CJ대한통운', '1234567890');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([orderedOrder]);
    const updated = newOrders.find(o => o.id === 'o1');

    expect(updated.carrier).toBe('CJ대한통운');
    expect(updated.tracking_number).toBe('1234567890');
    expect(updated.shipping_events).toEqual([
      expect.objectContaining({ status: '배송중', location: 'CJ대한통운', completed: true }),
      expect.objectContaining({ status: '주문접수', timestamp: '2026-05-01T11:00:00Z', completed: true }),
    ]);
    expect(mockShowToast).toHaveBeenCalledWith('송장이 등록됐습니다');
  });

  it('startTracking: 같은 shipment_group_id 주문에는 묶음 송장을 함께 등록', () => {
    const groupedOrders = [
      {
        ...orders[0],
        status: 'ordered',
        reviewed_at: '2026-05-01T11:00:00Z',
        shipment_group_id: 'sg1',
      },
      {
        id: 'o2',
        item_id: '2',
        qty: 3,
        status: 'ordered',
        requested_by: '김원장',
        requested_at: '2026-05-01T10:00:00Z',
        reviewed_at: '2026-05-01T11:00:00Z',
        shipment_group_id: 'sg1',
      },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: groupedOrders,
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
      result.current.startTracking('o1', 'CJ대한통운', '1234567890');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(groupedOrders);
    expect(newOrders.every(order => order.carrier === 'CJ대한통운')).toBe(true);
    expect(newOrders.every(order => order.tracking_number === '1234567890')).toBe(true);
    expect(newOrders.every(order => order.shipping_events[0].status === '배송중')).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith('2건 묶음 송장이 등록됐습니다');
  });

  it('startTracking: 기존 일괄 승인 데이터도 승인시각 기준으로 묶음 송장을 등록', () => {
    const groupedOrders = [
      {
        ...orders[0],
        status: 'ordered',
        reviewed_by: '이매니저',
        reviewed_at: '2026-05-01T11:00:00Z',
        review_note: '일괄 승인',
      },
      {
        id: 'o2',
        item_id: '2',
        qty: 3,
        status: 'ordered',
        requested_by: '김원장',
        requested_at: '2026-05-01T10:00:00Z',
        reviewed_by: '이매니저',
        reviewed_at: '2026-05-01T11:00:00Z',
        review_note: '일괄 승인',
      },
    ];
    const { result } = renderHook(() =>
      useOrderActions({
        orders: groupedOrders,
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
      result.current.startTracking('o1', 'CJ대한통운', '1234567890');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater(groupedOrders);
    expect(newOrders.every(order => order.tracking_number === '1234567890')).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith('2건 묶음 송장이 등록됐습니다');
  });

  it('refreshTracking: 송장 등록 주문의 배송 상태를 배송출발로 갱신', () => {
    const trackedOrder = {
      ...orders[0],
      status: 'ordered',
      carrier: 'CJ대한통운',
      tracking_number: '1234567890',
      shipping_events: [
        { status: '배송중', timestamp: '2026-05-01T12:00:00Z', location: 'CJ대한통운', completed: true },
      ],
    };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [trackedOrder],
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
      result.current.refreshTracking('o1');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([trackedOrder]);
    expect(newOrders[0].shipping_events[0]).toMatchObject({
      status: '배송출발',
      location: 'CJ대한통운',
      completed: true,
    });
    expect(mockSetNotifs).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('배송 상태가 갱신되었습니다');
  });

  it('refreshTracking: 배송출발 이후 배달완료 알림을 생성', () => {
    const trackedOrder = {
      ...orders[0],
      status: 'ordered',
      carrier: 'CJ대한통운',
      tracking_number: '1234567890',
      shipping_events: [
        { status: '배송출발', timestamp: '2026-05-01T12:00:00Z', location: 'CJ대한통운', completed: true },
        { status: '배송중', timestamp: '2026-05-01T11:00:00Z', location: 'CJ대한통운', completed: true },
      ],
    };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [trackedOrder],
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
      result.current.refreshTracking('o1');
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([trackedOrder]);
    expect(newOrders[0].delivery_completed_at).toBeDefined();
    expect(newOrders[0].shipping_events[0]).toMatchObject({
      status: '배달완료',
      location: '치과 접수대',
      completed: true,
    });

    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0]).toMatchObject({
      type: 'delivered',
      item_id: '1',
      message: '거즈 배달완료',
      sub: '입고 확인이 필요합니다',
    });
    expect(mockShowToast).toHaveBeenCalledWith('배달완료 알림이 생성되었습니다');
  });

  it('refreshTracking: server mode에서는 서버 배송 이벤트를 로컬 주문에 반영', async () => {
    const trackedOrder = {
      ...orders[0],
      status: 'ordered',
      carrier: 'CJ대한통운',
      tracking_number: '1234567890',
      shipping_events: [
        { status: '배송출발', timestamp: '2026-05-01T12:00:00Z', location: 'CJ대한통운', completed: true },
      ],
    };
    const trackingClient = {
      refreshTracking: vi.fn().mockResolvedValue({
        provider: 'demo',
        events: [
          { status: '배달완료', timestamp: '2026-05-02T12:00:00Z', location: '치과 접수대', completed: true },
        ],
      }),
    };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [trackedOrder],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal,
        repositoryAdapter: { isRemoteEnabled: true },
        trackingClient,
      })
    );

    await act(async () => {
      await result.current.refreshTracking('o1');
    });

    expect(trackingClient.refreshTracking).toHaveBeenCalledWith({
      carrier: 'CJ대한통운',
      trackingNumber: '1234567890',
      currentStatuses: ['배송출발'],
    });
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([trackedOrder]);
    expect(newOrders[0].shipping_events[0]).toMatchObject({
      status: '배달완료',
      location: '치과 접수대',
    });
    expect(mockSetNotifs).toHaveBeenCalledOnce();
  });

  it('refreshTracking: server mode 배송 조회 실패 시 로컬 상태를 변경하지 않음', async () => {
    const trackedOrder = {
      ...orders[0],
      status: 'ordered',
      carrier: 'CJ대한통운',
      tracking_number: '1234567890',
      shipping_events: [],
    };
    const trackingClient = {
      refreshTracking: vi.fn().mockRejectedValue(new Error('network_down')),
    };
    const { result } = renderHook(() =>
      useOrderActions({
        orders: [trackedOrder],
        setOrders: mockSetOrders,
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal,
        repositoryAdapter: { isRemoteEnabled: true },
        trackingClient,
      })
    );

    await act(async () => {
      await result.current.refreshTracking('o1');
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('배송 조회 서버에 연결할 수 없습니다');
  });
});
