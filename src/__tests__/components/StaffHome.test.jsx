import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffHome } from "../../components/screens/home/StaffHome";
import { todayKey } from "../../utils/helpers";

const today = todayKey();
const items = [
  { id: "gauze", name: "거즈", current_qty: 5, min_qty: 2, unit: "팩" },
  { id: "suture", name: "봉합사", current_qty: 4, min_qty: 1, unit: "개" },
];

function dashboardWithTodaySurgeries() {
  return {
    surgery: {
      today: [
        {
          id: "prep-surgery",
          title: "스태프 임플란트",
          patient: "홍길동",
          type: "implant",
          scheduled_date: today,
          scheduled_time: "10:00",
          prep_confirmed: false,
          usage_confirmed: false,
          required_items: [{ item_id: "gauze", qty: 1 }],
        },
        {
          id: "usage-surgery",
          title: "스태프 발치",
          patient: "김철수",
          type: "extraction",
          scheduled_date: today,
          scheduled_time: "14:00",
          prep_confirmed: true,
          usage_confirmed: false,
          required_items: [{ item_id: "suture", qty: 1 }],
        },
      ],
      todayTodo: [{ id: "prep-surgery" }, { id: "usage-surgery" }],
    },
    inventory: { low: [], out: [] },
    activity: { todayOut: 0 },
  };
}

function renderStaffHome(role) {
  const props = {
    role,
    dashboard: dashboardWithTodaySurgeries(),
    items,
    setTab: vi.fn(),
    openModal: vi.fn(),
    canViewSurgery: true,
    canManageSurgery: false,
    canConfirmSurgery: true,
    confirmSurgeryPrep: vi.fn(),
    confirmSurgeryUsage: vi.fn(),
    openItemsEditor: vi.fn(),
    updateSurgeryItems: vi.fn(),
  };

  return {
    ...render(<StaffHome {...props} />),
    props,
  };
}

describe.each(["hygienist", "staff"])("StaffHome surgery entrypoint for %s", role => {
  it("홈에서 오늘 수술 준비와 사용량 확인 경로가 보인다", async () => {
    const user = userEvent.setup();
    const { props } = renderStaffHome(role);

    expect(screen.getByRole("button", { name: /오늘 수술/ })).toBeInTheDocument();
    expect(screen.getByText("오늘 수술 준비")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /스태프 임플란트/ }));
    await user.click(screen.getByRole("button", { name: "품목 편집" }));
    expect(props.openItemsEditor).toHaveBeenCalledWith(
      [{ item_id: "gauze", qty: 1 }],
      expect.any(Function),
      "10:00 · 스태프 임플란트"
    );

    await user.click(screen.getByRole("button", { name: "준비 확인" }));
    expect(props.confirmSurgeryPrep).toHaveBeenCalledWith("prep-surgery");

    await user.click(screen.getByRole("button", { name: /스태프 발치/ }));
    await user.click(screen.getByRole("button", { name: "출고 확인" }));
    expect(props.confirmSurgeryUsage).toHaveBeenCalledWith(
      "usage-surgery",
      [{ item_id: "suture", qty: 1 }],
      ""
    );
  });
});
