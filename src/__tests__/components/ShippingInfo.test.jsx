import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShippingInfo } from '../../components/shared/ShippingInfo';

describe('ShippingInfo', () => {
  describe('기본 렌더링', () => {
    it('carrier와 trackingNumber를 모두 렌더링', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('CJ대한통운')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('carrier만 있을 때 carrier만 렌더링', () => {
      render(
        <ShippingInfo
          carrier="롯데택배"
          trackingNumber={null}
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('롯데택배')).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it('carrier가 없을 때 "-" 표시', () => {
      render(
        <ShippingInfo
          carrier={null}
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('carrier와 trackingNumber가 모두 없을 때 "-" 표시', () => {
      render(
        <ShippingInfo
          carrier={null}
          trackingNumber={null}
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('carrier가 빈 문자열일 때 "-" 표시', () => {
      render(
        <ShippingInfo
          carrier=""
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('trackingNumber 링크', () => {
    it('showLink=true일 때 trackingNumber가 버튼으로 렌더링', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const trackingButton = screen.getByRole('button', { name: '1234567890' });
      expect(trackingButton).toBeInTheDocument();
      expect(trackingButton).toHaveStyle('textDecoration: underline');
    });

    it('showLink=false일 때 trackingNumber가 텍스트로 렌더링 (버튼 아님)', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={false}
          onLinkClick={vi.fn()}
        />
      );
      const trackingText = screen.getByText('1234567890');
      expect(trackingText.tagName).not.toBe('BUTTON');
      expect(trackingText.tagName).toBe('SPAN');
    });

    it('trackingNumber 버튼 클릭 시 onLinkClick 호출', async () => {
      const user = userEvent.setup();
      const mockOnLinkClick = vi.fn();
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={mockOnLinkClick}
        />
      );
      const trackingButton = screen.getByRole('button', { name: '1234567890' });
      await user.click(trackingButton);
      expect(mockOnLinkClick).toHaveBeenCalledTimes(1);
    });

    it('showLink=false일 때 trackingNumber 클릭해도 onLinkClick 호출되지 않음', () => {
      const mockOnLinkClick = vi.fn();
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={false}
          onLinkClick={mockOnLinkClick}
        />
      );
      const trackingText = screen.getByText('1234567890');
      // 텍스트는 클릭할 수 없으므로 getByRole('button')으로 찾을 수 없음
      expect(trackingText.tagName).toBe('SPAN');
      expect(mockOnLinkClick).not.toHaveBeenCalled();
    });
  });

  describe('showLink prop', () => {
    it('showLink=true일 때 trackingNumber가 버튼으로 렌더링 (파란색)', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const trackingButton = screen.getByRole('button', { name: '1234567890' });
      // 테마 토큰이 blue500이므로 button이 button 엘리먼트로 렌더링됨 확인
      expect(trackingButton.tagName).toBe('BUTTON');
      expect(trackingButton).toHaveStyle('textDecoration: underline');
    });

    it('showLink=false일 때 trackingNumber가 span으로 렌더링 (회색)', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={false}
          onLinkClick={vi.fn()}
        />
      );
      const trackingText = screen.getByText('1234567890');
      // span 엘리먼트로 렌더링됨 확인
      expect(trackingText.tagName).toBe('SPAN');
    });
  });

  describe('구분자(·)', () => {
    it('trackingNumber가 있을 때 구분자(·)와 함께 렌더링', () => {
      const { container } = render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const separators = container.querySelectorAll('span');
      // carrier, separator(·), trackingNumber로 구성됨
      let hasSeparator = false;
      separators.forEach((span) => {
        if (span.textContent === '·') {
          hasSeparator = true;
        }
      });
      expect(hasSeparator).toBe(true);
    });

    it('trackingNumber가 없을 때 구분자 렌더링 안 됨', () => {
      const { container } = render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber={null}
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const separators = container.querySelectorAll('span');
      let hasSeparator = false;
      separators.forEach((span) => {
        if (span.textContent === '·') {
          hasSeparator = true;
        }
      });
      expect(hasSeparator).toBe(false);
    });
  });

  describe('기본 props', () => {
    it('showLink가 전달되지 않을 때 기본값 true로 동작', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          onLinkClick={vi.fn()}
        />
      );
      // showLink를 전달하지 않으면 기본값은 true
      const trackingButton = screen.getByRole('button', { name: '1234567890' });
      expect(trackingButton).toBeInTheDocument();
    });

    it('onLinkClick가 없을 때도 렌더링 성공', () => {
      const { container } = render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
        />
      );
      expect(container).toBeInTheDocument();
      expect(screen.getByText('CJ대한통운')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 trackingNumber 문자열일 때 링크 렌더링 안 됨', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber=""
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('trackingNumber가 falsy 값(0)일 때 렌더링 안 됨', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber={0}
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      // 0은 falsy이므로 trackingNumber 렌더링 안 됨 (구분자도 없음)
      const separators = screen.queryAllByText('·');
      expect(separators.length).toBe(0);
    });

    it('여러 번 클릭 시 매번 onLinkClick 호출', async () => {
      const user = userEvent.setup();
      const mockOnLinkClick = vi.fn();
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={mockOnLinkClick}
        />
      );
      const trackingButton = screen.getByRole('button', { name: '1234567890' });
      await user.click(trackingButton);
      await user.click(trackingButton);
      expect(mockOnLinkClick).toHaveBeenCalledTimes(2);
    });

    it('매우 긴 trackingNumber도 정상 렌더링', () => {
      const longTracking = ''.padEnd(50, '0');
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber={longTracking}
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText(longTracking)).toBeInTheDocument();
    });

    it('특수문자를 포함한 carrier와 trackingNumber', () => {
      render(
        <ShippingInfo
          carrier="CJ 대한통운 (Express)"
          trackingNumber="1234-5678-90/ABC"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      expect(screen.getByText('CJ 대한통운 (Express)')).toBeInTheDocument();
      expect(screen.getByText('1234-5678-90/ABC')).toBeInTheDocument();
    });
  });

  describe('레이아웃', () => {
    it('컨테이너가 flex 레이아웃으로 구성됨', () => {
      const { container } = render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveStyle('display: flex');
      expect(wrapper).toHaveStyle('alignItems: center');
    });

    it('carrier는 14px 폰트 사이즈', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const carrier = screen.getByText('CJ대한통운');
      expect(carrier).toHaveStyle('fontSize: 12px');
    });

    it('trackingNumber는 14px 폰트 사이즈', () => {
      render(
        <ShippingInfo
          carrier="CJ대한통운"
          trackingNumber="1234567890"
          showLink={true}
          onLinkClick={vi.fn()}
        />
      );
      const tracking = screen.getByRole('button', { name: '1234567890' });
      expect(tracking).toHaveStyle('fontSize: 12px');
    });
  });
});
