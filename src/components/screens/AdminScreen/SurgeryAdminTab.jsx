import { useState, useEffect, useMemo } from "react";
import { CalendarPlus, ChevronUp, PackageCheck, ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { formatMoney } from "../../../utils/money";
import { todayKey } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { SecTitle } from "../../shared/SecTitle";
import { SurgeryList } from "./SurgeryList";
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
  const [analysisMode, setAnalysisMode] = useState("prep");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
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
  const analysisModes = [
    { id:"prep", label:"준비" },
    { id:"stock", label:"재고 영향" },
    { id:"usage", label:"사용량" },
  ];

  return (
    <>
      <SecTitle>수술 체크포인트</SecTitle>
      <Card style={{ padding:16, marginBottom:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:8, marginBottom:14 }}>
          {[
            { label:"오늘 수술", value:`${surgeryInsights.todayPlannedCount}건`, Icon:CalendarPlus, color:T.blue500 },
            { label:"부족 품목", value:surgeryInsights.bulkShortageRows.length ? `${surgeryInsights.bulkShortageRows.length}종` : "없음", Icon:ShoppingCart, color:surgeryInsights.bulkShortageRows.length ? T.orange500 : T.green500 },
            { label:"수술 후 재고", value:surgeryInsights.weeklyProjectedStockRows.length ? `${surgeryInsights.weeklyProjectedStockRows.length}종` : "안정", Icon:PackageCheck, color:surgeryInsights.weeklyProjectedStockRows.length ? T.orange500 : T.green500 },
          ].map(row => (
            <div key={row.label} style={{ minWidth:0, border:`1px solid ${T.grey200}`, borderRadius:12, padding:"10px 8px", background:T.white }}>
              <row.Icon size={17} color={row.color} />
              <p style={{ margin:"6px 0 2px", fontSize:12, lineHeight:"16px", fontWeight:700, color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.label}</p>
              <p style={{ margin:0, fontSize:18, lineHeight:"23px", fontWeight:900, color:row.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.value}</p>
            </div>
          ))}
        </div>

        {surgeryInsights.bulkShortageRows.length > 0 && (
          <button
            type="button"
            onClick={openSurgeryBulkOrder}
            disabled={!openModal}
            style={{ width:"100%", minHeight:50, borderRadius:9999, border:"none", background:openModal ? T.blue500 : T.grey200, color:openModal ? T.white : T.grey500, fontFamily:font, fontSize:16, fontWeight:800, cursor:openModal ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:10 }}
          >
            <ShoppingCart size={18} />
            부족 품목 일괄 발주
          </button>
        )}
        <div style={{ display:"flex", background:T.grey100, borderRadius:9999, padding:3 }}>
          {analysisModes.map(mode => {
            const active = analysisMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAnalysisMode(mode.id)}
                style={{ flex:1, minHeight:38, borderRadius:9999, border:"none", background:active ? T.white : "transparent", boxShadow:active ? T.shadowControl : "none", color:active ? T.grey900 : T.grey500, fontFamily:font, fontSize:14, fontWeight:active ? 900 : 700, cursor:"pointer" }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </Card>

      <SurgeryAnalysisPanel
        mode={analysisMode}
        surgeryInsights={surgeryInsights}
        openModal={openModal}
        onOpenBulkOrder={openSurgeryBulkOrder}
      />

      <button
        type="button"
        onClick={() => setShowScheduleForm(prev => !prev)}
        style={{ width:"100%", minHeight:52, borderRadius:9999, border:"none", background:T.grey900, color:T.white, fontFamily:font, fontSize:16, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:14 }}
      >
        {showScheduleForm ? <ChevronUp size={18}/> : <CalendarPlus size={18}/>}
        {showScheduleForm ? "일정 등록 닫기" : "수술 일정 추가"}
      </button>

      {showScheduleForm && (
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
      )}
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

function SurgeryAnalysisPanel({ mode, surgeryInsights, openModal, onOpenBulkOrder }) {
  if (mode === "prep") {
    const rows = surgeryInsights.bulkShortageRows.slice(0, 3);
    return (
      <>
        <SecTitle>준비 확인</SecTitle>
        <Card style={{ padding:16, marginBottom:14 }}>
          {rows.length === 0 ? (
            <>
              <p style={{ margin:0, fontSize:16, lineHeight:"22px", fontWeight:900, color:T.green500 }}>부족 품목 없음</p>
              <p style={{ margin:"4px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500 }}>이번 주 준비 전 수술 기준으로 현재 재고가 충분해요.</p>
            </>
          ) : (
            <>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                {rows.map(row => (
                  <SimpleAnalysisRow
                    key={row.id}
                    title={row.item?.name || "삭제된 품목"}
                    sub={`${row.surgeryTitles.slice(0, 2).join(", ")}${row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}`}
                    value={`${row.shortageQty}${row.unit} 부족`}
                    tone={T.orange500}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenBulkOrder}
                disabled={!openModal}
                style={{ width:"100%", minHeight:48, borderRadius:9999, border:"none", background:openModal ? T.blue500 : T.grey200, color:openModal ? T.white : T.grey500, fontFamily:font, fontSize:15, fontWeight:900, cursor:openModal ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}
              >
                <ShoppingCart size={17}/>
                부족 품목 일괄 발주
              </button>
            </>
          )}
        </Card>
      </>
    );
  }

  if (mode === "stock") {
    const rows = surgeryInsights.weeklyProjectedStockRows.slice(0, 3);
    return (
      <>
        <SecTitle>재고 영향</SecTitle>
        <Card style={{ padding:16, marginBottom:14 }}>
          {rows.length === 0 ? (
            <>
              <p style={{ margin:0, fontSize:16, lineHeight:"22px", fontWeight:900, color:T.green500 }}>수술 후 재고 안정</p>
              <p style={{ margin:"4px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500 }}>이번 주 예정 수술 차감 후 최소재고 미달 예상 품목이 없어요.</p>
            </>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {rows.map(row => (
                <SimpleAnalysisRow
                  key={row.id}
                  title={row.item?.name || "삭제된 품목"}
                  sub={`${row.surgeryTitles.slice(0, 2).join(", ")}${row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}`}
                  value={row.isNewShortage ? "신규 부족" : `${row.afterShortageQty}${row.unit} 미달`}
                  tone={row.isNewShortage ? T.orange500 : T.grey800}
                />
              ))}
            </div>
          )}
        </Card>
      </>
    );
  }

  const rows = surgeryInsights.usageRows.slice(0, 3);
  return (
    <>
      <SecTitle>사용량 확인</SecTitle>
      <Card style={{ padding:16, marginBottom:14 }}>
        {rows.length === 0 ? (
          <>
            <p style={{ margin:0, fontSize:16, lineHeight:"22px", fontWeight:900, color:T.grey800 }}>사용량 입력 대기</p>
            <p style={{ margin:"4px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500 }}>수술 후 실제 사용량을 확정하면 예상 대비 차이를 보여줘요.</p>
          </>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {rows.map(summary => {
              const over = summary.deltaCost > 0;
              return (
                <SimpleAnalysisRow
                  key={summary.surgery.id}
                  title={summary.surgery.title}
                  sub={`예상 ${formatMoney(summary.expectedCost)} · 실사용 ${formatMoney(summary.actualCost)}`}
                  value={summary.deltaCost === 0 ? "동일" : `${over ? "+" : "-"}${formatMoney(Math.abs(summary.deltaCost))}`}
                  tone={summary.deltaCost === 0 ? T.green500 : over ? T.orange500 : T.green500}
                />
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function SimpleAnalysisRow({ title, sub, value, tone }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0, border:`1px solid ${T.grey100}`, borderRadius:12, padding:"11px 12px", background:T.grey50 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:15, lineHeight:"20px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</p>
        <p style={{ margin:"2px 0 0", fontSize:12, lineHeight:"17px", color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</p>
      </div>
      <p style={{ margin:0, flexShrink:0, maxWidth:"38%", fontSize:13, lineHeight:"18px", fontWeight:900, color:tone, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
    </div>
  );
}
