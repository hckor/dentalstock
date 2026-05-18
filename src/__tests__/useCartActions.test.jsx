import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartActions } from '../hooks/useCartActions';

describe('useCartActions', () => {
  let mockSetCart, mockSetOrders, mockSetNotifs, mockShowToast, mockSetTab;
  let cart, orders, items, currentUser;

  beforeEach(() => {
    mockSetCart = vi.fn();
    mockSetOrders = vi.fn();
    mockSetNotifs = vi.fn();
    mockShowToast = vi.fn();
    mockSetTab = vi.fn();

    cart = [
      { item_id: '1', qty: 5, note: '급함' },
      { item_id: '2', qty: 3, note: '' }
    ];

    orders = [
      {
        id: 'o1',
        item_id: '99',
        qty: 5,
        status: 'pending',
        requested_by: '김원장',
        requested_at: '2026-05-01T10:00:00Z'
      }
    ];

    items = [
      { id: '1', name: '거즈', unit: '박스' },
      { id: '2', name: '면봉', unit: '상자' },
      { id: '3', name: '주사바늘', unit: '개' }
    ];

    currentUser = { name: '박위생사', role: 'hygienist' };
  });

  it('updateCartQty: 특정 item의 qty 업데이트', () => {
    const { result } = renderHook(() =>
      useCartActions({
        cart,
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.updateCartQty('1', 10);
    });

    expect(mockSetCart).toHaveBeenCalledOnce();
    const cartUpdater = mockSetCart.mock.calls[0][0];
    const newCart = cartUpdater(cart);
    expect(newCart.find(c => c.item_id === '1').qty).toBe(10);
    expect(newCart.find(c => c.item_id === '2').qty).toBe(3);
  });

  it('removeFromCart: 특정 item 제거', () => {
    const { result } = renderHook(() =>
      useCartActions({
        cart,
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.removeFromCart('1');
    });

    expect(mockSetCart).toHaveBeenCalledOnce();
    const cartUpdater = mockSetCart.mock.calls[0][0];
    const newCart = cartUpdater(cart);
    expect(newCart).toHaveLength(1);
    expect(newCart[0].item_id).toBe('2');
  });

  it('clearCart: 빈 cart면 confirm 안 띄우고 아무것도 안 함', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    const { result } = renderHook(() =>
      useCartActions({
        cart: [],
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.clearCart();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockSetCart).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('clearCart: cart가 비어있지 않으면 confirm 띄우고, 사용자 동의 시 비움', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() =>
      useCartActions({
        cart,
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.clearCart();
    });

    expect(confirmSpy).toHaveBeenCalledWith('장바구니를 모두 비우시겠습니까?');
    expect(mockSetCart).toHaveBeenCalledOnce();
    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(mockShowToast).toHaveBeenCalledWith('장바구니를 비웠어요');

    confirmSpy.mockRestore();
  });

  it('clearCart: cart가 비어있지 않으면 confirm 띄우고, 사용자 거부 시 아무것도 안 함', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { result } = renderHook(() =>
      useCartActions({
        cart,
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.clearCart();
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockSetCart).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('submitCart: cart의 각 row마다 order 생성, cart 비우기, setTab 호출', () => {
    const { result } = renderHook(() =>
      useCartActions({
        cart,
        setCart: mockSetCart,
        orders: [],
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.submitCart();
    });

    // setOrders
    expect(mockSetOrders).toHaveBeenCalledOnce();
    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([]);
    expect(newOrders).toHaveLength(2);
    expect(newOrders[0]).toMatchObject({
      item_id: '1',
      requested_by: '박위생사',
      qty: 5,
      note: '급함',
      status: 'pending',
      reviewed_by: null
    });
    expect(newOrders[0].id).toMatch(/^o\d+-0$/);
    expect(newOrders[1]).toMatchObject({
      item_id: '2',
      qty: 3,
      note: '',
      status: 'pending'
    });
    expect(newOrders[1].id).toMatch(/^o\d+-1$/);

    // setNotifs
    expect(mockSetNotifs).toHaveBeenCalledOnce();
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs).toHaveLength(2);
    expect(newNotifs[0].type).toBe('order_req');
    expect(newNotifs[0].item_id).toBe('1');
    expect(newNotifs[0].message).toContain('거즈');
    expect(newNotifs[1].item_id).toBe('2');
    expect(newNotifs[1].message).toContain('면봉');

    // setCart
    expect(mockSetCart).toHaveBeenCalledWith([]);

    // setTab
    expect(mockSetTab).toHaveBeenCalledWith('home');

    // showToast
    expect(mockShowToast).toHaveBeenCalledWith('2건 발주 요청 완료');
  });

  it('submitCart: 빈 cart면 아무것도 안 함', () => {
    const { result } = renderHook(() =>
      useCartActions({
        cart: [],
        setCart: mockSetCart,
        orders: [],
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.submitCart();
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockSetNotifs).not.toHaveBeenCalled();
    expect(mockSetCart).not.toHaveBeenCalled();
    expect(mockSetTab).not.toHaveBeenCalled();
  });

  it('submitCart: 일부에 active order가 있으면 그것만 제외', () => {
    const cartWithActiveOrder = [
      { item_id: '1', qty: 5, note: '급함' },
      { item_id: '99', qty: 3, note: '' }, // orders에 pending status로 존재
      { item_id: '2', qty: 2, note: '' }
    ];

    const { result } = renderHook(() =>
      useCartActions({
        cart: cartWithActiveOrder,
        setCart: mockSetCart,
        orders,
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.submitCart();
    });

    const ordersUpdater = mockSetOrders.mock.calls[0][0];
    const newOrders = ordersUpdater([]);
    expect(newOrders).toHaveLength(2); // item '99'는 제외됨
    expect(newOrders.some(o => o.item_id === '99')).toBe(false);
    expect(newOrders.some(o => o.item_id === '1')).toBe(true);
    expect(newOrders.some(o => o.item_id === '2')).toBe(true);

    expect(mockShowToast).toHaveBeenCalledWith('2건 발주 요청 완료 (1건 자동 제외)');
  });

  it('submitCart: 모든 item이 active order인 경우 토스트만 띄움', () => {
    const cartAllActive = [
      { item_id: '99', qty: 5, note: '' },
      { item_id: '99', qty: 3, note: '' }
    ];

    const { result } = renderHook(() =>
      useCartActions({
        cart: cartAllActive,
        setCart: mockSetCart,
        orders: [
          {
            id: 'o1',
            item_id: '99',
            qty: 5,
            status: 'pending',
            requested_by: '김원장',
            requested_at: '2026-05-01T10:00:00Z'
          }
        ],
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.submitCart();
    });

    expect(mockSetOrders).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('이미 진행 중인 발주만 있어요');
  });

  it('submitCart: notif의 sub 필드에 item unit이 포함됨', () => {
    const { result } = renderHook(() =>
      useCartActions({
        cart: [{ item_id: '1', qty: 5, note: '' }],
        setCart: mockSetCart,
        orders: [],
        setOrders: mockSetOrders,
        setNotifs: mockSetNotifs,
        items,
        currentUser,
        showToast: mockShowToast,
        setTab: mockSetTab
      })
    );

    act(() => {
      result.current.submitCart();
    });

    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs[0].sub).toContain('박위생사');
    expect(newNotifs[0].sub).toContain('5');
    expect(newNotifs[0].sub).toContain('박스');
  });
});
