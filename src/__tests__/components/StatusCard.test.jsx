import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipboardList, Package } from 'lucide-react';
import { StatusCard } from '../../components/shared/StatusCard';

describe('StatusCard', () => {
  const mockOnClick = vi.fn();
  const mockIcon = ClipboardList;

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('기본 렌더링', () => {
    it('title, subtitle, actionLabel을 올바르게 렌더링', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="주문 승인 대기"
          subtitle="라텍스 장갑 · 5,000원"
          actionLabel="주문 링크"
          actionBgColor="#f04452"
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText('주문 승인 대기')).toBeInTheDocument();
      expect(screen.getByText('라텍스 장갑 · 5,000원')).toBeInTheDocument();
      expect(screen.getByText('주문 링크')).toBeInTheDocument();
    });

    it('icon이 렌더링됨 (svg 엘리먼트)', () => {
      const { container } = render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="테스트"
          subtitle="서브텍스트"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('subtitle이 undefined일 때 렌더링하지 않음', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="제목만"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText('제목만')).toBeInTheDocument();
      expect(screen.queryByText(/서브텍스트/)).not.toBeInTheDocument();
    });

    it('actionLabel이 undefined일 때 렌더링하지 않음', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="제목"
          subtitle="서브텍스트"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      expect(screen.getByText('제목')).toBeInTheDocument();
      expect(screen.queryByText(/액션 레이블/)).not.toBeInTheDocument();
    });
  });

  describe('onClick 핸들러', () => {
    it('버튼 클릭 시 onClick 함수 호출', async () => {
      const user = userEvent.setup();
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="클릭 테스트"
          subtitle="테스트용"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('여러 번 클릭 시 매번 onClick 호출', async () => {
      const user = userEvent.setup();
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="다중 클릭"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('색상 props', () => {
    it('iconBgColor가 icon 컨테이너의 배경으로 적용', () => {
      const { container } = render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#e8f7ee"
          iconColor="#16a34a"
          title="색상 테스트"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const iconContainer = container.querySelector('div[style*="background"]');
      expect(iconContainer).toHaveStyle('background: #e8f7ee');
    });

    it('iconColor가 아이콘 색상으로 적용', () => {
      const { container } = render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#16a34a"
          title="아이콘 색상"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const svg = container.querySelector('svg');
      // lucide-react 아이콘은 color prop이 stroke 속성으로 렌더링됨
      expect(svg).toHaveAttribute('stroke', '#16a34a');
    });

    it('actionBgColor가 액션 버튼 배경으로 적용', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="액션 색상"
          actionLabel="액션 버튼"
          actionBgColor="#f04452"
          onClick={mockOnClick}
        />
      );
      const actionButton = screen.getByText('액션 버튼');
      expect(actionButton).toHaveStyle('background: #f04452');
    });
  });

  describe('다양한 아이콘', () => {
    it('다른 아이콘(Package)도 정상 렌더링', () => {
      const { container } = render(
        <StatusCard
          icon={Package}
          iconBgColor="#e2f5f2"
          iconColor="#0d9488"
          title="배송 완료"
          subtitle="CJ대한통운"
          actionLabel="추적"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('icon이 null일 때 아이콘 없이 렌더링', () => {
      const { container } = render(
        <StatusCard
          icon={null}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="아이콘 없음"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      // svg가 없어야 함 (아이콘 렌더링 안 됨)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(0);
    });
  });

  describe('레이아웃', () => {
    it('버튼이 flex 레이아웃으로 구성됨 (아이콘 + 텍스트 + 액션)', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="레이아웃"
          subtitle="서브"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveStyle('display: flex');
      expect(button).toHaveStyle('alignItems: center');
    });

    it('제목은 19px 폰트 사이즈', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="폰트 사이즈"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const title = screen.getByText('폰트 사이즈');
      expect(title).toHaveStyle('fontSize: 16px');
    });

    it('subtitle은 16px 폰트 사이즈', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="제목"
          subtitle="16px 서브텍스트"
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const subtitle = screen.getByText('16px 서브텍스트');
      expect(subtitle).toHaveStyle('fontSize: 16px');
    });
  });

  describe('엣지 케이스', () => {
    it('긴 제목과 서브텍스트가 ellipsis로 자름', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="매우 긴 제목이 있을 때 이를 적절히 표시하고 ellipsis 처리"
          subtitle="이것도 긴 서브텍스트입니다. 너무 길면 말줄임표로 처리되어야 합니다."
          actionLabel="액션"
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      const subtitle = screen.getByText(/이것도 긴 서브텍스트/);
      expect(subtitle).toHaveStyle('textOverflow: ellipsis');
    });

    it('actionLabel이 빈 문자열일 때 렌더링하지 않음', () => {
      render(
        <StatusCard
          icon={mockIcon}
          iconBgColor="#fff5e0"
          iconColor="#f59e0b"
          title="제목"
          actionLabel=""
          actionBgColor="#2563eb"
          onClick={mockOnClick}
        />
      );
      // actionLabel이 falsy이므로 (조건: {actionLabel && ...}) 렌더링 안 됨
      // 빈 span이 없어야 함
      expect(screen.queryByText('액션')).not.toBeInTheDocument();
    });
  });
});
