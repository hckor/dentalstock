import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { settingsApi } from '../api/settingsApi';
import { auditLogsApi } from '../api/auditLogsApi';
import { useOrderActions } from '../hooks/useOrderActions';
import { useSurgeryActions } from '../hooks/useSurgeryActions';
import { DEFAULT_CLINIC_ID, localRepository, setActiveClinicId } from '../repositories/localRepository';

const manager = { id: 'u-manager', name: '이매니저', role: 'manager' };

function applyState(current, updater) {
  return typeof updater === 'function' ? updater(current) : updater;
}

function renderWorkflow() {
  const state = {
    items: [
      {
        id: 'glove-m',
        name: '라텍스 장갑 (M)',
        unit: '박스',
        current_qty: 1,
        min_qty: 5,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 12000, sku: 'GL-M-D' },
          { vendor_id: 2, vendor_name: '오스템몰', price: 13500, sku: 'GL-M-O' },
        ],
      },
      {
        id: 'mask-kf94',
        name: '마스크 KF94',
        unit: '박스',
        current_qty: 2,
        min_qty: 6,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 18000, sku: 'MK-D' },
          { vendor_id: 2, vendor_name: '오스템몰', price: 15000, sku: 'MK-O' },
        ],
      },
      {
        id: 'cotton-roll',
        name: '코튼롤',
        unit: '봉',
        current_qty: 0,
        min_qty: 3,
        vendor_options: [
          { vendor_id: 1, vendor_name: '덴올', price: 5000, sku: 'CR-D' },
          { vendor_id: 2, vendor_name: '오스템몰', price: 6200, sku: 'CR-O' },
        ],
      },
      {
        id: 'fixture',
        name: '임플란트 픽스처 4.0mm',
        unit: '개',
        current_qty: 4,
        min_qty: 2,
      },
    ],
    orders: [],
    surgeries: [
      {
        id: 'surgery-1',
        title: '오전 임플란트 수술',
        patient: '홍길동',
        type: 'implant',
        scheduled_date: '2026-05-20',
        scheduled_time: '10:30',
        required_items: [
          { item_id: 'glove-m', qty: 1 },
          { item_id: 'fixture', qty: 1 },
        ],
        prep_confirmed: false,
        usage_confirmed: false,
      },
    ],
    txs: [],
    notifs: [],
  };
  const setOrders = vi.fn(updater => { state.orders = applyState(state.orders, updater); });
  const setItems = vi.fn(updater => { state.items = applyState(state.items, updater); });
  const setTxs = vi.fn(updater => { state.txs = applyState(state.txs, updater); });
  const setNotifs = vi.fn(updater => { state.notifs = applyState(state.notifs, updater); });
  const setSurgeries = vi.fn(updater => { state.surgeries = applyState(state.surgeries, updater); });
  const showToast = vi.fn();
  const firePush = vi.fn();
  const setModal = vi.fn();

  const view = renderHook(() => {
    const firedRemindersRef = useRef(new Set());
    return {
      order: useOrderActions({
        orders: state.orders,
        setOrders,
        items: state.items,
        setItems,
        setTxs,
        setNotifs,
        currentUser: manager,
        showToast,
        setModal,
      }),
      surgery: useSurgeryActions({
        surgeries: state.surgeries,
        setSurgeries,
        items: state.items,
        setItems,
        setTxs,
        setNotifs,
        currentUser: manager,
        showToast,
        firePush,
        firedRemindersRef,
      }),
    };
  });

  return { ...view, state, showToast, setModal };
}

beforeEach(() => {
  setActiveClinicId(DEFAULT_CLINIC_ID);
  localRepository.clearAll();
  settingsApi.save({
    preferredVendor: 'lowest',
    maxOrderAmount: '50000',
    vendors: [
      { id: 1, name: '덴올', automaticOrdering: true },
      { id: 2, name: '오스템몰', automaticOrdering: true },
    ],
  });
  auditLogsApi.save([]);
});

describe('order and surgery operational workflow', () => {
  it('부족 품목을 일괄 발주하고 거래처별 배송/입고와 수술 실사용량 출고까지 이어진다', () => {
    const workflow = renderWorkflow();

    act(() => {
      workflow.result.current.order.submitBulkOrders([
        { item: workflow.state.items.find(item => item.id === 'glove-m'), qty: 4 },
        { item: workflow.state.items.find(item => item.id === 'mask-kf94'), qty: 4 },
        { item: workflow.state.items.find(item => item.id === 'cotton-roll'), qty: 3 },
      ], '부족 품목 일괄 발주');
    });
    workflow.rerender();

    expect(workflow.state.orders).toHaveLength(3);
    expect(workflow.state.orders.every(order => order.status === 'pending')).toBe(true);

    act(() => {
      workflow.result.current.order.approveOrders(workflow.state.orders.map(order => order.id), '일괄 승인');
    });
    workflow.rerender();

    const denallOrders = workflow.state.orders.filter(order => order.vendor_name === '덴올');
    const osstemOrders = workflow.state.orders.filter(order => order.vendor_name === '오스템몰');
    expect(denallOrders).toHaveLength(2);
    expect(osstemOrders).toHaveLength(1);
    expect(new Set(denallOrders.map(order => order.shipment_group_id)).size).toBe(1);
    expect(denallOrders[0].shipment_group_id).toBeTruthy();
    expect(osstemOrders[0].shipment_group_id).toBeUndefined();

    act(() => {
      workflow.result.current.order.startTracking(denallOrders[0].id, 'CJ대한통운', '1234567890');
    });
    workflow.rerender();

    expect(workflow.state.orders.filter(order => order.vendor_name === '덴올').every(order => order.tracking_number === '1234567890')).toBe(true);
    expect(workflow.state.orders.find(order => order.vendor_name === '오스템몰').tracking_number).toBeUndefined();

    const denallReceiptRows = workflow.state.orders
      .filter(order => order.vendor_name === '덴올')
      .map(order => ({ orderId: order.id, actualQty: order.qty }));

    act(() => {
      workflow.result.current.order.confirmReceipts(denallReceiptRows, '묶음 배송 수량 확인');
    });
    workflow.rerender();

    expect(workflow.state.orders.filter(order => order.vendor_name === '덴올').every(order => order.status === 'received')).toBe(true);
    expect(workflow.state.orders.find(order => order.vendor_name === '오스템몰').status).toBe('ordered');
    expect(workflow.state.items.find(item => item.id === 'glove-m').current_qty).toBe(5);
    expect(workflow.state.items.find(item => item.id === 'cotton-roll').current_qty).toBe(3);

    act(() => {
      workflow.result.current.surgery.confirmSurgeryPrep('surgery-1');
    });
    workflow.rerender();

    act(() => {
      workflow.result.current.surgery.confirmSurgeryUsage('surgery-1', [
        { item_id: 'glove-m', qty: 1 },
        { item_id: 'fixture', qty: 0 },
      ], '실사용량 확인');
    });
    workflow.rerender();

    expect(workflow.state.surgeries[0]).toMatchObject({
      prep_confirmed: true,
      usage_confirmed: true,
      actual_items: [
        { item_id: 'glove-m', qty: 1 },
        { item_id: 'fixture', qty: 0 },
      ],
    });
    expect(workflow.state.items.find(item => item.id === 'glove-m').current_qty).toBe(4);
    expect(workflow.state.items.find(item => item.id === 'fixture').current_qty).toBe(4);
    expect(workflow.state.txs.map(tx => tx.type)).toEqual(['out', 'in', 'in']);
    expect(workflow.state.txs[0]).toMatchObject({ item_id: 'glove-m', qty: 1, surgery_id: 'surgery-1' });

    const actions = auditLogsApi.list().map(log => log.action);
    expect(actions).toEqual(expect.arrayContaining([
      'order.bulk_requested',
      'order.bulk_approved',
      'order.tracking_registered',
      'order.bulk_received',
      'surgery.prep_confirmed',
      'surgery.usage_confirmed',
    ]));
    expect(auditLogsApi.list().find(log => log.action === 'order.tracking_registered').metadata.tracking_number_last4).toBe('7890');
    expect(workflow.showToast).toHaveBeenCalledWith('실사용 1개 품목 출고 완료');
  });
});
