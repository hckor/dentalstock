import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderRequestSheet } from '../components/modals/OrderRequestSheet';

const mockItem = {
  id: '1',
  name: '라텍스 장갑 (M)',
  category_id: 1,
  unit: '박스',
  current_qty: 3,
  min_qty: 5,
  location: '창고 A-1',
  expiry: null,
};

const mockUser = { id: 'u3', name: '박위생사', role: 'hygienist' };

describe('OrderRequestSheet', () => {
  it('renders title and item name', () => {
    render(
      <OrderRequestSheet
        item={mockItem}
        currentUser={mockUser}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('발주 요청')).toBeInTheDocument();
    expect(screen.getByText('라텍스 장갑 (M)')).toBeInTheDocument();
  });

  it('defaults qty to (min_qty - current_qty)', () => {
    render(
      <OrderRequestSheet
        item={mockItem}
        currentUser={mockUser}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    // min_qty (5) - current_qty (3) = 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('increments qty when + button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <OrderRequestSheet
        item={mockItem}
        currentUser={mockUser}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    // The icons (Plus/Minus) are svg children of buttons. Filter buttons by their inline color/style.
    const buttons = screen.getAllByRole('button');
    // The plus button is the last circular icon button before the submit button.
    // It has Plus icon. We'll locate it via lucide-react Plus svg class.
    const plusButton = buttons.find(
      (b) => b.querySelector('svg.lucide-plus') !== null
    );
    expect(plusButton).toBeTruthy();
    await user.click(plusButton);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onSubmit with (item, qty, note) when submit button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <OrderRequestSheet
        item={mockItem}
        currentUser={mockUser}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );
    const submitBtn = screen.getByRole('button', { name: /장바구니에 담기/ });
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(mockItem, 2, '');
  });
});
