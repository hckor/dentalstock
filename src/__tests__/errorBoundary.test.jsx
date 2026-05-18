import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/ErrorBoundary';

function Bomb() {
  throw new Error("부럼");
}

let errSpy;
beforeEach(() => {
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  errSpy.mockRestore();
});

describe('ErrorBoundary', () => {
  it('자식이 정상이면 그대로 렌더링', () => {
    render(<ErrorBoundary><div>안녕</div></ErrorBoundary>);
    expect(screen.getByText('안녕')).toBeInTheDocument();
  });

  it('자식이 throw하면 fallback UI 렌더링', () => {
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('앗, 문제가 발생했어요')).toBeInTheDocument();
    expect(screen.getByText(/부럼/)).toBeInTheDocument();
  });

  it('"다시 시도" 버튼 클릭하면 자식 다시 시도', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('앗, 문제가 발생했어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    // 정상 자식으로 교체하면 fallback이 사라짐
    rerender(<ErrorBoundary><div>복구됨</div></ErrorBoundary>);
    expect(screen.getByText('복구됨')).toBeInTheDocument();
  });
});
