import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffAdminPanel } from "../../components/screens/AdminScreen/StaffAdminPanel";

const users = [
  { id: "u-owner", name: "김원장", role: "owner", active: true, email: "owner@example.com" },
  { id: "u-manager", name: "이매니저", role: "manager", active: true, email: "manager@example.com" },
  { id: "u-staff", name: "박위생사", role: "hygienist", active: true, email: "staff@example.com" },
];

function renderPanel(overrides = {}) {
  const props = {
    users,
    currentUser: users[0],
    canManageStaff: true,
    inviteForm: { email: "", name: "", role: "hygienist" },
    setInviteForm: vi.fn(),
    inviteBusy: false,
    submitInvite: vi.fn(event => event.preventDefault()),
    onStaffActiveChange: vi.fn(),
    onStaffRoleChange: vi.fn(),
    onStaffDelete: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<StaffAdminPanel {...props} />),
    props,
  };
}

describe("StaffAdminPanel owner-only controls", () => {
  it("manager view에서는 직원 삭제, 권한, 활성 controls가 비활성화되고 초대 버튼이 숨겨진다", () => {
    renderPanel({
      currentUser: users[1],
      canManageStaff: false,
    });

    expect(screen.queryByRole("button", { name: "직원 초대" })).not.toBeInTheDocument();
    expect(screen.getByText(/초대, 권한 변경, 비활성화, 목록 제거는 원장만/)).toBeInTheDocument();
    expect(screen.getByLabelText("박위생사 직원 목록에서 제거")).toBeDisabled();
    expect(screen.getAllByRole("combobox").every(select => select.disabled)).toBe(true);
    expect(screen.getAllByRole("button", { name: "비활성" }).every(button => button.disabled)).toBe(true);
  });

  it("owner view에서는 다른 직원의 삭제, 권한, 활성 controls를 사용할 수 있다", async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    const staffDeleteButton = screen.getByLabelText("박위생사 직원 목록에서 제거");
    await user.click(staffDeleteButton);
    expect(props.onStaffDelete).toHaveBeenCalledWith(users[2]);

    const roleSelect = screen.getAllByRole("combobox").find(select => select.value === "hygienist");
    expect(roleSelect).toBeEnabled();
    await user.selectOptions(roleSelect, "manager");
    expect(props.onStaffRoleChange).toHaveBeenCalledWith(users[2], "manager");

    const inactiveButton = within(staffDeleteButton.parentElement).getByRole("button", { name: "비활성" });
    expect(inactiveButton).toBeEnabled();
    await user.click(inactiveButton);
    expect(props.onStaffActiveChange).toHaveBeenCalledWith(users[2], false);
  });
});
