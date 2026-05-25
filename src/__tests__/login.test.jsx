import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { resetToInitial } from '../api/seed';

async function typePin(user, digits) {
  for (const d of digits) {
    const btn = screen.getByRole('button', { name: new RegExp(`^${d}$`) });
    await user.click(btn);
  }
}

beforeEach(() => {
  resetToInitial();
});

describe('Login flow', () => {
  it('초기 화면에 DentalStock 제목과 사용자 목록 표시', () => {
    render(<App />);
    expect(screen.getByText('DentalStock')).toBeInTheDocument();
    expect(screen.getByText('김원장')).toBeInTheDocument();
    expect(screen.getByText('이매니저')).toBeInTheDocument();
    expect(screen.getByText('박위생사')).toBeInTheDocument();
    expect(screen.getByText('한스태프')).toBeInTheDocument();
    expect(screen.getByText(/스태프 2222/)).toBeInTheDocument();
  });

  it('사용자를 선택하면 PIN 화면으로 이동', async () => {
    const user = userEvent.setup();
    render(<App />);
    const ownerBtn = screen.getByRole('button', { name: /김원장/ });
    await user.click(ownerBtn);
    expect(screen.getByText('PIN 4자리를 입력하세요')).toBeInTheDocument();
  });

  it('잘못된 PIN은 에러 메시지 + 남은 시도 횟수 표시', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /김원장/ }));
    await typePin(user, ['9', '9', '9', '9']);

    await waitFor(
      () => {
        expect(screen.getByText(/PIN이 올바르지 않습니다/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('올바른 PIN(1234)을 입력하면 대시보드로 진입', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /김원장/ }));
    await typePin(user, ['1', '2', '3', '4']);

    await waitFor(
      () => {
        expect(screen.getByText('대시보드')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
