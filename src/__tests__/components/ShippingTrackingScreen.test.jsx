import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShippingTrackingScreen } from '../../components/screens/ShippingTrackingScreen';
import { InventoryProvider } from '../../contexts/InventoryContext';
import { OrderProvider } from '../../contexts/OrderContext';

const baseProps = {
  currentUser: { name: '김원장', role: 'owner' },
  canApprove: true,
  openModal: vi.fn(),
  showToast: vi.fn(),
};

function renderWithProviders({ orders, items }) {
  return render(
    <InventoryProvider items={items} setItems={vi.fn()} txs={[]} setTxs={vi.fn()} setNotifs={vi.fn()} currentUser={baseProps.currentUser} showToast={vi.fn()} setModal={vi.fn()}>
      <OrderProvider orders={orders} setOrders={vi.fn()} items={items} setItems={vi.fn()} setTxs={vi.fn()} setNotifs={vi.fn()} currentUser={baseProps.currentUser} showToast={vi.fn()} setModal={vi.fn()}>
        <ShippingTrackingScreen {...baseProps} />
      </OrderProvider>
    </InventoryProvider>
  );
}

const allItems = [
  { id: '1', name: '석션 팁', unit: '봉' },
  { id: '2', name: '멸균 인디케이터', unit: '팩' },
  { id: '3', name: '에피네프린', unit: '앰플' },
];

describe('ShippingTrackingScreen', () => {
  it('완료 탭은 입고일과 배송 묶음 기준으로 요약 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders({
      items: allItems,
      orders: [
        {
          id: 'o1',
          item_id: '1',
          qty: 2,
          status: 'received',
          received_qty: 2,
          received_at: '2026-05-20T10:00:00',
          shipment_group_id: 'sg1',
          vendor_name: '덴올',
          carrier: 'CJ대한통운',
          tracking_number: '1234567890',
        },
        {
          id: 'o2',
          item_id: '2',
          qty: 1,
          status: 'received',
          received_qty: 1,
          received_at: '2026-05-20T10:02:00',
          shipment_group_id: 'sg1',
          vendor_name: '덴올',
          carrier: 'CJ대한통운',
          tracking_number: '1234567890',
        },
        {
          id: 'o3',
          item_id: '3',
          qty: 10,
          status: 'received',
          received_qty: 10,
          received_at: '2026-05-19T15:00:00',
          vendor_name: '오스템몰',
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: /완료\s*3/ }));

    expect(screen.getByText(/5월 20일/)).toBeInTheDocument();
    expect(screen.getByText(/5월 19일/)).toBeInTheDocument();
    expect(screen.getByText('묶음 입고 2건')).toBeInTheDocument();
    expect(screen.getByText(/덴올/)).toBeInTheDocument();
    expect(screen.getByText(/석션 팁 2봉/)).toBeInTheDocument();
    expect(screen.getByText('에피네프린')).toBeInTheDocument();
  });
});
