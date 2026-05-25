import { useState, useEffect, useMemo } from "react";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { todayKey } from "../../../utils/helpers";
import { SurgeryBulkOrderCard } from "./SurgeryBulkOrderCard";
import { SurgeryList } from "./SurgeryList";
import { SurgeryOperationsSummary } from "./SurgeryOperationsSummary";
import { SurgeryScheduleForm } from "./SurgeryScheduleForm";
import {
  WEEK_WINDOW_DAYS,
  buildProjectedStockRows,
  buildSurgeryBulkShortageRows,
  buildTemplateGroups,
  isWithinNextDays,
  summarizeSurgery,
} from "./SurgeryAdminTab.utils";

export function SurgeryAdminTab({items = [], surgeries = [], addSurgery, deleteSurgery, openItemsEditor, updateSurgeryItems, openModal}) {
  const [type, setType] = useState("implant");
  const [title, setTitle] = useState("오전 임플란트 수술");
  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("10:30");
  const [note, setNote] = useState("");
  const preset = SURGERY_PRESETS[type];
  const [draftItems, setDraftItems] = useState(preset.items.map(r=>({...r})));
  const [draftCustomized, setDraftCustomized] = useState(false);
  const templateGroups = useMemo(() => buildTemplateGroups(type, items), [type, items]);
  const sortedSurgeries = useMemo(
    () => [...surgeries].sort((a,b)=>`${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`)),
    [surgeries],
  );
  const surgeryInsights = useMemo(() => {
    const itemMap = new Map(items.map(item => [item.id, item]));
    const summaries = sortedSurgeries.map(surgery => summarizeSurgery(surgery, itemMap));
    const today = todayKey();
    const upcoming = summaries.filter(summary => summary.surgery.scheduled_date >= today);
    const weeklyPrepRows = summaries.filter(summary =>
      !summary.surgery.prep_confirmed &&
      !summary.surgery.usage_confirmed &&
      isWithinNextDays(summary.surgery.scheduled_date, today, WEEK_WINDOW_DAYS)
    );
    const todayPlannedRows = summaries.filter(summary =>
      !summary.surgery.usage_confirmed &&
      summary.surgery.scheduled_date === today
    );
    const weeklyPlannedRows = summaries.filter(summary =>
      !summary.surgery.usage_confirmed &&
      isWithinNextDays(summary.surgery.scheduled_date, today, WEEK_WINDOW_DAYS)
    );
    const focusRows = upcoming.length ? upcoming : summaries;
    const expectedTotal = focusRows.reduce((sum, summary) => sum + summary.expectedCost, 0);
    const actualRows = summaries.filter(summary => summary.hasActual);
    const usageDelta = actualRows.reduce((sum, summary) => sum + summary.deltaCost, 0);
    const riskRows = focusRows
      .filter(summary => summary.shortageCount > 0)
      .sort((a, b) => b.shortageCount - a.shortageCount || b.expectedCost - a.expectedCost);
    const highCostRows = focusRows
      .filter(summary => summary.expectedCost > 0)
      .sort((a, b) => b.expectedCost - a.expectedCost)
      .slice(0, 3);
    const usageRows = actualRows
      .sort((a, b) => Math.abs(b.deltaCost) - Math.abs(a.deltaCost))
      .slice(0, 3);

    return {
      summaries,
      focusRows,
      totalLabel: upcoming.length ? "예정" : "전체",
      expectedTotal,
      usageDelta,
      hasUsageData: actualRows.length > 0,
      riskRows: riskRows.slice(0, 3),
      riskCount: riskRows.length,
      highCostRows,
      usageRows,
      unpricedCount: focusRows.reduce((sum, summary) => sum + summary.unpricedCount, 0),
      weeklyPrepCount: weeklyPrepRows.length,
      bulkShortageRows: buildSurgeryBulkShortageRows(weeklyPrepRows, itemMap),
      todayPlannedCount: todayPlannedRows.length,
      weeklyPlannedCount: weeklyPlannedRows.length,
      todayProjectedStockRows: buildProjectedStockRows(todayPlannedRows, itemMap),
      weeklyProjectedStockRows: buildProjectedStockRows(weeklyPlannedRows, itemMap),
    };
  }, [items, sortedSurgeries]);

  // 수술 유형 변경 시 사용자 편집이 없었다면 프리셋으로 동기화
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!draftCustomized) setDraftItems(preset.items.map(r=>({...r})));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = () => {
    addSurgery({type, title:title.trim()||preset.label, patient:patient.trim(), scheduled_date:date, scheduled_time:time, note:note.trim(), required_items:draftItems});
    setTitle(preset.label);
    setPatient("");
    setNote("");
    setDraftItems(preset.items.map(r=>({...r})));
    setDraftCustomized(false);
  };

  const editDraft = () => openItemsEditor(
    draftItems,
    (newItems)=>{ setDraftItems(newItems); setDraftCustomized(true); },
    `${preset.label} · ${title || preset.label}`,
  );
  const resetDraft = () => { setDraftItems(preset.items.map(r=>({...r}))); setDraftCustomized(false); };
  const removeSurgery = (surgery) => {
    if (window.confirm(`${surgery.title} 수술 일정을 삭제할까요?`)) deleteSurgery(surgery.id);
  };
  const openSurgeryBulkOrder = () => {
    if (!openModal) return;
    openModal("bulk_order", {
      type: "bulk_order_context",
      title: "수술 부족 품목 발주",
      description: "이번 주 준비 전 수술에서 부족한 품목만 모았습니다.",
      note: "수술 준비 부족 품목 일괄 발주",
      rows: surgeryInsights.bulkShortageRows.map(row => ({
        item_id: row.id,
        qty: row.shortageQty,
        sourceLabel: "수술 준비",
        reason: `${row.surgeryTitles.slice(0, 2).join(", ")}${row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""} · 필요 ${row.requiredQty}${row.unit} / 현재 ${row.currentQty}${row.unit}`,
      })),
    });
  };

  return (
    <>
      <SurgeryOperationsSummary surgeryInsights={surgeryInsights}/>
      <SurgeryBulkOrderCard surgeryInsights={surgeryInsights} openModal={openModal} onOpenBulkOrder={openSurgeryBulkOrder}/>
      <SurgeryScheduleForm
        type={type}
        setType={setType}
        title={title}
        setTitle={setTitle}
        patient={patient}
        setPatient={setPatient}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        note={note}
        setNote={setNote}
        preset={preset}
        templateGroups={templateGroups}
        draftCustomized={draftCustomized}
        draftItems={draftItems}
        items={items}
        onEditDraft={editDraft}
        onResetDraft={resetDraft}
        onSubmit={submit}
      />
      <SurgeryList
        sortedSurgeries={sortedSurgeries}
        surgeryInsights={surgeryInsights}
        openItemsEditor={openItemsEditor}
        updateSurgeryItems={updateSurgeryItems}
        onRemoveSurgery={removeSurgery}
      />
    </>
  );
}
