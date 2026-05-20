import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useSurgeryActions } from '../hooks/useSurgeryActions';

function renderSurgeryHook(overrides = {}) {
  const surgeries = overrides.surgeries || [
    {
      id: 's1',
      title: '오전 임플란트 수술',
      patient: '홍길동',
      type: 'implant',
      scheduled_date: '2026-05-21',
      scheduled_time: '10:30',
      required_items: [
        { item_id: '1', qty: 2 },
        { item_id: '2', qty: 1 },
      ],
      prep_confirmed: true,
      usage_confirmed: false,
    },
  ];
  const items = overrides.items || [
    { id: '1', name: '임플란트 픽스처', unit: '개', current_qty: 5 },
    { id: '2', name: 'Bone Graft', unit: '병', current_qty: 3 },
  ];
  const setSurgeries = vi.fn();
  const setItems = vi.fn();
  const setTxs = vi.fn();
  const setNotifs = vi.fn();
  const showToast = vi.fn();
  const firePush = vi.fn();

  const result = renderHook(() => {
    const firedRemindersRef = useRef(new Set());
    return useSurgeryActions({
      surgeries,
      setSurgeries,
      items,
      setItems,
      setTxs,
      setNotifs,
      currentUser: { name: '김원장', role: 'owner' },
      showToast,
      firePush,
      firedRemindersRef,
    });
  });

  return { ...result, surgeries, items, setSurgeries, setItems, setTxs, setNotifs, showToast };
}

describe('useSurgeryActions', () => {
  it('confirmSurgeryUsage: 실사용량만 재고에서 차감하고 출고 기록을 남긴다', () => {
    const { result, items, surgeries, setItems, setTxs, setSurgeries, setNotifs, showToast } = renderSurgeryHook();

    act(() => {
      result.current.confirmSurgeryUsage('s1', [
        { item_id: '1', qty: 1 },
        { item_id: '2', qty: 0 },
      ], '실제 사용량 확인');
    });

    const itemsUpdater = setItems.mock.calls[0][0];
    const newItems = itemsUpdater(items);
    expect(newItems.find(item => item.id === '1').current_qty).toBe(4);
    expect(newItems.find(item => item.id === '2').current_qty).toBe(3);

    const txsUpdater = setTxs.mock.calls[0][0];
    const newTxs = txsUpdater([]);
    expect(newTxs).toHaveLength(1);
    expect(newTxs[0]).toMatchObject({
      item_id: '1',
      type: 'out',
      qty: 1,
      surgery_id: 's1',
    });
    expect(newTxs[0].note).toContain('수술 실사용 확정');

    const surgeriesUpdater = setSurgeries.mock.calls[0][0];
    const newSurgeries = surgeriesUpdater(surgeries);
    expect(newSurgeries[0]).toMatchObject({
      usage_confirmed: true,
      usage_confirmed_by: '김원장',
      actual_items: [
        { item_id: '1', qty: 1 },
        { item_id: '2', qty: 0 },
      ],
    });

    expect(setNotifs).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith('실사용 1개 품목 출고 완료');
  });

  it('confirmSurgeryUsage: 현재 재고보다 많이 입력하면 변경하지 않는다', () => {
    const { result, setItems, setTxs, setSurgeries, showToast } = renderSurgeryHook();

    act(() => {
      result.current.confirmSurgeryUsage('s1', [{ item_id: '1', qty: 99 }], '');
    });

    expect(setItems).not.toHaveBeenCalled();
    expect(setTxs).not.toHaveBeenCalled();
    expect(setSurgeries).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('임플란트 픽스처 현재 재고는 5개입니다.');
  });
});
