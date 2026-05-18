import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function TestComponent() {
  const { mode, toggle } = useTheme();
  return (
    <>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggle}>토글</button>
    </>
  );
}

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* ignore */ }
});

describe('ThemeContext', () => {
  it('기본 모드는 light (저장된 값 없을 때)', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggle 호출하면 dark로 전환', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    await user.click(screen.getByText('토글'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('mode 변경 시 localStorage에 저장', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><TestComponent /></ThemeProvider>);
    await user.click(screen.getByText('토글'));
    expect(window.localStorage.getItem('dentalstock:theme')).toBe('dark');
  });
});
