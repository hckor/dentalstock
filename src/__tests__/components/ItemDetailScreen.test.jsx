import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemDetailScreen } from "../../components/screens/ItemDetailScreen";

const item = {
  id: "item-1",
  name: "임플란트 픽스처",
  current_qty: 4,
  min_qty: 2,
  unit: "개",
  category_id: 3,
  location: "수술실",
  vendor_options: [
    { vendor_id: "v1", vendor_name: "덴올", price: 90000, shipping_fee: 0, last_checked_at: "2026-05-20T00:00:00.000Z" },
  ],
};

function renderDetail(role) {
  return render(
    <ItemDetailScreen
      item={item}
      txs={[]}
      orders={[]}
      currentUser={{ id: `u-${role}`, name: role, role }}
      onClose={vi.fn()}
      onIn={vi.fn()}
      onOut={vi.fn()}
      onOrder={vi.fn()}
      onEdit={vi.fn()}
    />
  );
}

describe("ItemDetailScreen price tab permissions", () => {
  it.each(["staff", "hygienist"])("%s에게 가격 탭을 노출하지 않는다", role => {
    renderDetail(role);

    expect(screen.queryByRole("button", { name: "가격" })).not.toBeInTheDocument();
    expect(screen.queryByText("가격 감시")).not.toBeInTheDocument();
  });

  it("owner에게 가격 탭과 가격 감시 내용을 노출한다", async () => {
    const user = userEvent.setup();
    renderDetail("owner");

    await user.click(screen.getByRole("button", { name: "가격" }));
    expect(screen.getByText("가격 감시")).toBeInTheDocument();
    expect(screen.getByText("덴올")).toBeInTheDocument();
  });
});
