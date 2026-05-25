import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SURGERY_PRESETS } from "../../constants/surgeryPresets";
import { SurgeryScheduleForm } from "../../components/screens/AdminScreen/SurgeryScheduleForm";
import { buildTemplateGroups } from "../../components/screens/AdminScreen/SurgeryAdminTab.utils";

describe("SurgeryScheduleForm template summary", () => {
  it("템플릿에 누락된 품목이 있으면 재고 OK로 표시하지 않는다", () => {
    const items = [{ id: "27", name: "픽스처", current_qty: 3, unit: "개" }];
    const draftItems = [
      { item_id: "27", qty: 1 },
      { item_id: "missing-template-item", qty: 1 },
    ];

    render(
      <SurgeryScheduleForm
        type="implant"
        setType={vi.fn()}
        title="오전 임플란트"
        setTitle={vi.fn()}
        patient=""
        setPatient={vi.fn()}
        date="2026-05-26"
        setDate={vi.fn()}
        time="10:30"
        setTime={vi.fn()}
        note=""
        setNote={vi.fn()}
        preset={SURGERY_PRESETS.implant}
        templateGroups={buildTemplateGroups("implant", items)}
        draftCustomized={false}
        draftItems={draftItems}
        items={items}
        onEditDraft={vi.fn()}
        onResetDraft={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("확인 1")).toBeInTheDocument();
    expect(screen.queryByText("재고 OK")).not.toBeInTheDocument();
  });
});
