import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TasksCard } from '../../components/screens/home/TasksCard';

const mockItems = [
  { id: '1', name: '라텍스 장갑 (M)', price: 5000 },
  { id: '2', name: 'N95 마스크', price: 3000 },
];

const mockApprovalOrders = [
  { id: 'order-1', item_id: '1' },
  { id: 'order-2', item_id: '2' },
];

const mockShippingOrders = [
  { id: 'ship-1', item_id: '1', carrier: 'CJ대한통운', tracking_number: '1234567890' },
  { id: 'ship-2', item_id: '2', carrier: '롯데택배', tracking_number: null },
];

describe('TasksCard', () => {
  describe('조건부 렌더링', () => {
    it('approvalOrders와 shippingOrders가 모두 비어있으면 null을 반환', () => {
      const { container } = render(
        <TasksCard
          canApprove={true}
          approvalOrders={[]}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('approvalOrders가 있으면 "주문 승인 대기" 텍스트 렌더링 (canApprove=true)', () => {
      // approvalOrders에 1개가 있으면, "주문 승인 대기 1건"이 1번 렌더링됨 (order마다)
      const singleApproval = [mockApprovalOrders[0]];
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={singleApproval}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/주문 승인 대기 1건/)).toBeInTheDocument();
      expect(screen.getByText('오늘 해야 할 일')).toBeInTheDocument();
    });

    it('canApprove=false일 때는 approvalOrders를 무시하고 렌더링하지 않음', () => {
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={mockApprovalOrders}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.queryByText(/주문 승인 대기/)).not.toBeInTheDocument();
    });

    it('shippingOrders가 있으면 "배송 완료" 텍스트 렌더링', () => {
      const singleShipping = [mockShippingOrders[0]];
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={singleShipping}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/배송 완료 1건/)).toBeInTheDocument();
      expect(screen.getByText('오늘 해야 할 일')).toBeInTheDocument();
    });

    it('approvalOrders와 shippingOrders가 모두 있으면 둘 다 렌더링', () => {
      const singleApproval = [mockApprovalOrders[0]];
      const singleShipping = [mockShippingOrders[0]];
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={singleApproval}
          shippingOrders={singleShipping}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/주문 승인 대기/)).toBeInTheDocument();
      expect(screen.getByText(/배송 완료/)).toBeInTheDocument();
      // 헤더에서 "2건" 확인 (span에만 있음)
      const span = screen.getAllByText(/2건/).find(el => el.tagName === 'SPAN');
      expect(span).toBeInTheDocument();
    });
  });

  describe('콘텐츠 렌더링', () => {
    it('approvalOrders: 아이콘, 제목, 서브텍스트(상품명·가격) 정확히 렌더링', () => {
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={[mockApprovalOrders[0]]}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/주문 승인 대기 1건/)).toBeInTheDocument();
      expect(screen.getByText(/라텍스 장갑 \(M\) · 5,000/)).toBeInTheDocument();
    });

    it('approvalOrders: 존재하지 않는 item_id일 때 "-" 표시', () => {
      const invalidOrders = [{ id: 'order-invalid', item_id: '999' }];
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={invalidOrders}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/- · 0/)).toBeInTheDocument();
    });

    it('shippingOrders: 아이콘, 제목, 서브텍스트(상품명·배송사·송장번호) 정확히 렌더링', () => {
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={[mockShippingOrders[0]]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/배송 완료 1건/)).toBeInTheDocument();
      expect(screen.getByText(/라텍스 장갑 \(M\)/)).toBeInTheDocument();
      expect(screen.getByText(/CJ대한통운/)).toBeInTheDocument();
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    });

    it('shippingOrders: 송장번호가 없을 때 배송사만 표시', () => {
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={[mockShippingOrders[1]]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/롯데택배/)).toBeInTheDocument();
      // 송장번호 분리자(·)와 송장번호는 표시되지 않음
      expect(screen.queryByText(/· -/)).not.toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('approvalOrders: 버튼에 "주문 링크" 레이블 렌더링', () => {
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={[mockApprovalOrders[0]]}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      const linkButton = buttons.find(btn => btn.textContent.includes('주문 링크'));
      expect(linkButton).toBeTruthy();
    });

    it('shippingOrders: 버튼에 "입고 확인" 레이블 렌더링', () => {
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={[mockShippingOrders[0]]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find(btn => btn.textContent.includes('입고 확인'));
      expect(checkButton).toBeTruthy();
    });

    it('버튼 클릭 시 onClick 핸들러 호출 (승인 주문)', async () => {
      const user = userEvent.setup();
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={[mockApprovalOrders[0]]}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons.find(btn => btn.textContent.includes('주문 링크'));
      expect(button).toBeTruthy();
      await user.click(button);
    });

    it('버튼 클릭 시 onClick 핸들러 호출 (배송 주문)', async () => {
      const user = userEvent.setup();
      render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={[mockShippingOrders[0]]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons.find(btn => btn.textContent.includes('입고 확인'));
      expect(button).toBeTruthy();
      await user.click(button);
    });
  });

  describe('헤더', () => {
    it('"오늘 해야 할 일" 제목과 작업 건수 표시', () => {
      const singleApproval = [mockApprovalOrders[0]];
      const singleShipping = [mockShippingOrders[0]];
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={singleApproval}
          shippingOrders={singleShipping}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText('오늘 해야 할 일')).toBeInTheDocument();
      // 헤더의 "2건"을 span에서 찾음
      const headers = screen.getAllByText(/2건/);
      const headerSpan = headers.find(el => el.tagName === 'SPAN');
      expect(headerSpan).toBeInTheDocument();
    });

    it('approvalOrders만 있을 때 건수는 1건 표시', () => {
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={[mockApprovalOrders[0]]}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      // 헤더의 "1건"을 span에서 찾음
      const headers = screen.getAllByText(/1건/);
      const headerSpan = headers.find(el => el.tagName === 'SPAN');
      expect(headerSpan).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('items 배열이 비어있을 때 상품명을 "-"로 표시', () => {
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={[mockApprovalOrders[0]]}
          shippingOrders={[]}
          items={[]}
          setTab={vi.fn()}
        />
      );
      expect(screen.getByText(/- · 0/)).toBeInTheDocument();
    });

    it('approvalOrders의 길이가 여러 개일 때 모두 렌더링', () => {
      const multipleOrders = [
        { id: 'order-1', item_id: '1' },
        { id: 'order-2', item_id: '2' },
        { id: 'order-3', item_id: '1' },
      ];
      render(
        <TasksCard
          canApprove={true}
          approvalOrders={multipleOrders}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      // 승인 대기 3건이 표시됨 (각 order마다 한 번, 3번 렌더링)
      const approvalTexts = screen.getAllByText(/주문 승인 대기 3건/);
      expect(approvalTexts.length).toBe(3);
    });

    it('undefined approvalOrders는 빈 배열로 취급', () => {
      const { container } = render(
        <TasksCard
          canApprove={true}
          approvalOrders={undefined}
          shippingOrders={[]}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('undefined shippingOrders는 빈 배열로 취급', () => {
      const { container } = render(
        <TasksCard
          canApprove={false}
          approvalOrders={[]}
          shippingOrders={undefined}
          items={mockItems}
          setTab={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
