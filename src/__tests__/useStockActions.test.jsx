import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockActions } from '../hooks/useStockActions';

describe('useStockActions', () => {
  let mockSetItems, mockSetTxs, mockSetNotifs, mockShowToast, mockSetModal;
  let items, currentUser;

  beforeEach(() => {
    mockSetItems = vi.fn();
    mockSetTxs = vi.fn();
    mockSetNotifs = vi.fn();
    mockShowToast = vi.fn();
    mockSetModal = vi.fn();

    items = [
      { id: '1', name: '거즈', current_qty: 10, min_qty: 5, unit: '박스' },
      { id: '2', name: '면봉', current_qty: 20, min_qty: 10, unit: '상자' },
      { id: '3', name: '주사바늘', current_qty: 3, min_qty: 5, unit: '개' }
    ];

    currentUser = { name: '박위생사', role: 'hygienist' };
  });

  it('commit("in"): 재고 증가 + tx 기록', () => {
    const { result } = renderHook(() =>
      useStockActions({
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
      result.current.commit('in', items[0], { qty: 5, note: '주문 배송' });
    });

    // setItems 호출 검증
    expect(mockSetItems).toHaveBeenCalledOnce();
    const updatedItems = mockSetItems.mock.calls[0][0];
    expect(updatedItems.find(i => i.id === '1').current_qty).toBe(15);
    expect(updatedItems.find(i => i.id === '2').current_qty).toBe(20);

    // setTxs 호출 검증
    expect(mockSetTxs).toHaveBeenCalledOnce();
    const txsUpdater = mockSetTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs).toHaveLength(1);
    expect(newTxs[0].type).toBe('in');
    expect(newTxs[0].qty).toBe(5);
    expect(newTxs[0].item_id).toBe('1');
    expect(newTxs[0].note).toBe('주문 배송');
    expect(newTxs[0].user).toBe('박위생사');
    expect(newTxs[0].id).toMatch(/^t\d+$/);

    // 저수위 알림은 생성되지 않음 (15 >= 5)
    expect(mockSetNotifs).not.toHaveBeenCalled();

    // Toast와 Modal
    expect(mockShowToast).toHaveBeenCalledWith('입고 5박스 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('commit("out"): 재고 감소 + tx 기록', () => {
    const { result } = renderHook(() =>
      useStockActions({
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
      result.current.commit('out', items[0], { qty: 3, note: '진료실' });
    });

    // setItems: 10 - 3 = 7
    expect(mockSetItems).toHaveBeenCalledOnce();
    const updatedItems = mockSetItems.mock.calls[0][0];
    expect(updatedItems.find(i => i.id === '1').current_qty).toBe(7);

    // setTxs
    expect(mockSetTxs).toHaveBeenCalledOnce();
    const txsUpdater = mockSetTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs[0].type).toBe('out');
    expect(newTxs[0].qty).toBe(3);

    // Toast
    expect(mockShowToast).toHaveBeenCalledWith('출고 3박스 완료');
    expect(mockSetModal).toHaveBeenCalledWith(null);
  });

  it('commit("out"): qty > current_qty일 때 출고를 막고 토스트', () => {
    const { result } = renderHook(() =>
      useStockActions({
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
      result.current.commit('out', items[0], { qty: 50, note: '진료실' });
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith('현재 재고는 10박스입니다.');
    expect(mockSetModal).not.toHaveBeenCalled();
  });

  it('commit("out"): qty=0이면 아무것도 하지 않음', () => {
    const zeroQtyItem = { id: '1', name: '품목', current_qty: 0, min_qty: 5, unit: '박스' };
    const { result } = renderHook(() =>
      useStockActions({
        items: [zeroQtyItem],
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    act(() => {
      result.current.commit('out', zeroQtyItem, { qty: 5, note: '' });
    });

    // qty=0이므로 clamping 토스트는 뜨지 않음 (requestedQty는 5지만 qty는 0)
    // 하지만 showToast가 clamping 메시지와 함께 호출되고 return됨
    // 따라서 setItems, setTxs 호출 없음
    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
    // showToast는 clamping 경고 토스트가 호출됨
    expect(mockShowToast).toHaveBeenCalledWith('현재 재고는 0박스입니다.');
  });

  it('commit: 재고가 min_qty 이하로 떨어지면 low_stock 알림 생성', () => {
    const { result } = renderHook(() =>
      useStockActions({
        items,
        setItems: mockSetItems,
        setTxs: mockSetTxs,
        setNotifs: mockSetNotifs,
        currentUser,
        showToast: mockShowToast,
        setModal: mockSetModal
      })
    );

    // 현재: 주사바늘 3개, min_qty: 5개 -> 이미 저수위
    act(() => {
      result.current.commit('in', items[2], { qty: 1, note: '' });
    });

    // 입고 후: 4개 (여전히 5개 미만)
    const notifsUpdater = mockSetNotifs.mock.calls[0][0];
    const newNotifs = notifsUpdater([]);
    expect(newNotifs).toHaveLength(1);
    expect(newNotifs[0].type).toBe('low_stock');
    expect(newNotifs[0].item_id).toBe('3');
    expect(newNotifs[0].message).toBe('주사바늘 재고가 부족합니다');
    expect(newNotifs[0].is_read).toBe(false);
  });

  it('commit: null이나 유효하지 않은 selItem은 무시', () => {
    const { result } = renderHook(() =>
      useStockActions({
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
      result.current.commit('in', null, { qty: 5, note: '' });
    });

    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetTxs).not.toHaveBeenCalled();
  });

  it('commit: qty 문자열을 숫자로 변환', () => {
    const { result } = renderHook(() =>
      useStockActions({
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
      result.current.commit('in', items[0], { qty: '7', note: '' });
    });

    const updatedItems = mockSetItems.mock.calls[0][0];
    expect(updatedItems.find(i => i.id === '1').current_qty).toBe(17);
  });
});
