import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardCheck, Coins, Edit2, ListChecks, PackageCheck, ShoppingCart, Trash2, TrendingUp } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";
import { todayKey } from "../../../utils/helpers";
import { compactMoney, formatMoney, itemUnitPrice, toNumber } from "../../../utils/money";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { SecTitle } from "../../shared/SecTitle";
import { Inp } from "../../shared/Inp";

const WEEK_WINDOW_DAYS = 7;
const rowItems = (rows) => Array.isArray(rows) ? rows : [];

function summarizeSurgery(surgery, itemMap) {
  const requiredRows = rowItems(surgery.required_items);
  const actualRows = rowItems(surgery.actual_items);
  const expectedCost = requiredRows.reduce((sum, row) => sum + itemUnitPrice(itemMap.get(row.item_id)) * toNumber(row.qty), 0);
  const actualCost = actualRows.reduce((sum, row) => sum + itemUnitPrice(itemMap.get(row.item_id)) * toNumber(row.qty), 0);
  const rawShortageRows = requiredRows
    .map(row => {
      const item = itemMap.get(row.item_id);
      const requiredQty = toNumber(row.qty);
      const currentQty = toNumber(item?.current_qty);
      return {
        row,
        item,
        requiredQty,
        currentQty,
        shortageQty: Math.max(0, requiredQty - currentQty),
      };
    })
    .filter(row => !row.item || row.shortageQty > 0);
  const shortageRows = surgery.prep_confirmed || surgery.usage_confirmed ? [] : rawShortageRows;
  const unpricedCount = requiredRows.filter(row => itemUnitPrice(itemMap.get(row.item_id)) <= 0).length;
  const hasActual = actualRows.length > 0 || surgery.usage_confirmed;
  const deltaCost = hasActual ? actualCost - expectedCost : 0;
  const hasShortage = shortageRows.length > 0;
  const statusLabel = surgery.usage_confirmed
    ? "사용확인"
    : surgery.prep_confirmed
      ? "사용량 대기"
      : hasShortage
        ? `부족 ${shortageRows.length}종`
        : "준비 가능";

  return {
    surgery,
    requiredRows,
    actualRows,
    expectedCost,
    actualCost,
    deltaCost,
    hasActual,
    shortageRows,
    shortageCount: shortageRows.length,
    unpricedCount,
    statusLabel,
    statusColor: surgery.usage_confirmed ? T.green500 : hasShortage ? T.red500 : surgery.prep_confirmed ? T.orange500 : T.green500,
    statusBg: surgery.usage_confirmed ? T.green50 : hasShortage ? T.red50 : surgery.prep_confirmed ? T.orange50 : T.green50,
  };
}

function shortageReason(summary) {
  const firstRisk = summary.shortageRows?.[0];
  if (!firstRisk) return "";
  if (!firstRisk.item) return "준비 목록에 삭제된 품목이 포함됨";
  const unit = firstRisk.item.unit || "";
  const moreText = summary.shortageCount > 1 ? ` 외 ${summary.shortageCount - 1}종` : "";
  return `${firstRisk.item.name} 필요 ${firstRisk.requiredQty}${unit}, 현재 ${firstRisk.currentQty}${unit}라서 ${firstRisk.shortageQty}${unit} 부족${moreText}`;
}

function usageDeltaText(summary) {
  if (!summary.hasActual || summary.deltaCost === 0) return "";
  const direction = summary.deltaCost > 0 ? "초과" : "절감";
  return `실사용이 예상보다 ${formatMoney(Math.abs(summary.deltaCost))} ${direction}`;
}

function buildSurgeryGuidance(summary) {
  const reasons = [];
  const actions = [];
  const hasShortage = summary.shortageCount > 0;
  const hasUnpriced = summary.unpricedCount > 0;
  const hasUsageGap = summary.hasActual && summary.deltaCost !== 0;

  if (hasShortage) {
    reasons.push(shortageReason(summary));
    actions.push("보충 또는 준비 품목 조정");
  }
  if (hasUnpriced) {
    reasons.push(`단가 없는 품목 ${summary.unpricedCount}종이 예상 비용에서 빠짐`);
    actions.push("품목 단가 등록");
  }
  if (hasUsageGap) {
    reasons.push(usageDeltaText(summary));
    actions.push(summary.deltaCost > 0 ? "추가 사용 원인 확인" : "절감 사유 기록");
  }
  if (summary.hasActual && summary.deltaCost === 0) {
    reasons.push("실사용이 예상과 일치");
  }

  if (reasons.length === 0) {
    if (summary.surgery?.usage_confirmed) reasons.push("사용량 확정까지 완료됨");
    else if (summary.surgery?.prep_confirmed) reasons.push("준비 확인 완료, 사용량 입력만 남음");
    else reasons.push("필요 재고와 단가가 확인됨");
  }
  if (actions.length === 0) {
    if (summary.surgery?.usage_confirmed) actions.push("기록 유지");
    else if (summary.surgery?.prep_confirmed) actions.push("수술 후 사용량 확인");
    else actions.push("예정 시간 전 최종 준비 확인");
  }

  return {
    prefix: hasShortage || hasUnpriced || hasUsageGap ? "이유" : "안심",
    reason: reasons.filter(Boolean).join(" · "),
    action: [...new Set(actions)].join(" / "),
    tone: hasShortage ? T.red500 : hasUnpriced || hasUsageGap ? T.orange500 : T.green500,
  };
}

const TEMPLATE_GUIDE = {
  implant: [
    { label: "핵심 품목", tone: "primary", itemIds: ["27", "29", "30", "11"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["31", "32", "12"] },
    { label: "누락 주의", tone: "warning", itemIds: ["27", "29", "30"] },
  ],
  prostho: [
    { label: "핵심 품목", tone: "primary", itemIds: ["22", "24", "25"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["23", "26", "19"] },
    { label: "누락 주의", tone: "warning", itemIds: ["24", "25", "11"] },
  ],
  extraction: [
    { label: "핵심 품목", tone: "primary", itemIds: ["6", "11", "9"] },
    { label: "자주 추가", tone: "neutral", itemIds: ["12", "15", "14"] },
    { label: "누락 주의", tone: "warning", itemIds: ["6", "11", "12"] },
  ],
};

function isWithinNextDays(value, today, days) {
  if (!value) return false;
  const target = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return false;
  const diffDays = Math.floor((target.getTime() - base.getTime()) / 86400000);
  return diffDays >= 0 && diffDays < days;
}

function buildTemplateGroups(type, items) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const presetQtyById = new Map(rowItems(SURGERY_PRESETS[type]?.items).map(row => [row.item_id, toNumber(row.qty)]));
  return rowItems(TEMPLATE_GUIDE[type]).map(group => ({
    ...group,
    items: group.itemIds.map(itemId => {
      const item = itemMap.get(itemId);
      const qty = presetQtyById.get(itemId);
      return {
        id: itemId,
        name: item?.name || `품목 ${itemId}`,
        unit: item?.unit || "",
        qty,
        registered: Boolean(item),
      };
    }),
  }));
}

function buildSurgeryBulkShortageRows(summaries, itemMap) {
  const rowsByItemId = new Map();

  summaries.forEach(summary => {
    summary.requiredRows.forEach(row => {
      const item = itemMap.get(row.item_id);
      const existing = rowsByItemId.get(row.item_id) || {
        id: row.item_id,
        item,
        requiredQty: 0,
        currentQty: toNumber(item?.current_qty),
        unit: item?.unit || "",
        surgeryTitles: [],
        surgeryIds: new Set(),
      };
      existing.requiredQty += toNumber(row.qty);
      if (!existing.surgeryIds.has(summary.surgery.id)) {
        existing.surgeryIds.add(summary.surgery.id);
        existing.surgeryTitles.push(summary.surgery.title);
      }
      rowsByItemId.set(row.item_id, existing);
    });
  });

  return Array.from(rowsByItemId.values())
    .map(row => ({
      ...row,
      shortageQty: Math.max(0, row.requiredQty - row.currentQty),
    }))
    .filter(row => !row.item || row.shortageQty > 0)
    .sort((a, b) => b.shortageQty - a.shortageQty || b.requiredQty - a.requiredQty || String(a.item?.name || a.id).localeCompare(String(b.item?.name || b.id), "ko-KR"));
}

function buildProjectedStockRows(summaries, itemMap) {
  const rowsByItemId = new Map();

  summaries.forEach(summary => {
    summary.requiredRows.forEach(row => {
      const item = itemMap.get(row.item_id);
      const existing = rowsByItemId.get(row.item_id) || {
        id: row.item_id,
        item,
        requiredQty: 0,
        currentQty: toNumber(item?.current_qty),
        minQty: toNumber(item?.min_qty),
        unit: item?.unit || "",
        surgeryTitles: [],
        surgeryIds: new Set(),
      };
      existing.requiredQty += toNumber(row.qty);
      if (!existing.surgeryIds.has(summary.surgery.id)) {
        existing.surgeryIds.add(summary.surgery.id);
        existing.surgeryTitles.push(summary.surgery.title);
      }
      rowsByItemId.set(row.item_id, existing);
    });
  });

  return Array.from(rowsByItemId.values())
    .map(row => {
      const projectedQty = row.currentQty - row.requiredQty;
      const beforeShortageQty = Math.max(0, row.minQty - row.currentQty);
      const afterShortageQty = Math.max(0, row.minQty - projectedQty);
      const surgeryDrivenShortageQty = Math.max(0, afterShortageQty - beforeShortageQty);
      return {
        ...row,
        projectedQty,
        beforeShortageQty,
        afterShortageQty,
        surgeryDrivenShortageQty,
        isNewShortage: beforeShortageQty === 0 && afterShortageQty > 0,
      };
    })
    .filter(row => !row.item || row.afterShortageQty > 0)
    .sort((a, b) =>
      b.surgeryDrivenShortageQty - a.surgeryDrivenShortageQty ||
      b.afterShortageQty - a.afterShortageQty ||
      b.requiredQty - a.requiredQty ||
      String(a.item?.name || a.id).localeCompare(String(b.item?.name || b.id), "ko-KR")
    );
}

function projectedStockAction(row) {
  if (!row.item) return "삭제된 품목을 준비 목록에서 교체";
  if (row.isNewShortage) return "수술 전 선발주 또는 대체 재료 확보";
  if (row.surgeryDrivenShortageQty > 0) return "기존 부족분에 수술 사용량까지 포함해 보충";
  return "현재 부족 품목 보충 후 수술 준비";
}

function ProjectedStockRow({ row }) {
  const tone = row.isNewShortage ? T.red500 : row.surgeryDrivenShortageQty > 0 ? T.orange500 : T.grey700;
  const bg = row.isNewShortage ? T.red50 : row.surgeryDrivenShortageQty > 0 ? T.orange50 : T.grey50;
  const title = row.item?.name || "삭제된 품목";
  const surgeryText = `${row.surgeryTitles.slice(0, 2).join(", ")}${row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}`;

  return (
    <div style={{border:`1px solid ${tone}33`,background:bg,borderRadius:12,padding:"12px 13px",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:5}}>
        <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        <span style={{fontSize:14,lineHeight:"20px",fontWeight:800,color:tone,whiteSpace:"nowrap"}}>
          {row.isNewShortage ? "신규 부족" : `${row.afterShortageQty}${row.unit} 미달`}
        </span>
      </div>
      <p style={{margin:0,fontSize:13,lineHeight:"18px",fontWeight:700,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        수술 전 {row.currentQty}{row.unit} / 최소 {row.minQty}{row.unit} → 수술 후 {row.projectedQty}{row.unit}
      </p>
      <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        전 부족 {row.beforeShortageQty}{row.unit} · 후 부족 {row.afterShortageQty}{row.unit} · 필요 {row.requiredQty}{row.unit}
      </p>
      <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {surgeryText || "수술명 없음"} · 다음 행동: {projectedStockAction(row)}
      </p>
    </div>
  );
}

function MetricTile({ label, value, sub, Icon, color = T.grey900, bg = T.grey50 }) {
  return (
    <div style={{background:bg,borderRadius:12,padding:"14px 13px",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:7}}>
        <p style={{margin:0,fontSize:13,lineHeight:"18px",fontWeight:700,color:T.grey500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</p>
        {Icon && <Icon size={17} color={color} style={{flexShrink:0}}/>}
      </div>
      <p style={{margin:0,fontSize:22,lineHeight:"28px",fontWeight:800,color,fontFamily:monoFont,fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{value}</p>
      {sub && <p style={{margin:"4px 0 0",fontSize:12,lineHeight:"17px",color:T.grey500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</p>}
    </div>
  );
}

function TemplateChecklistGroup({ group }) {
  const color = group.tone === "primary" ? T.blue500 : group.tone === "warning" ? T.orange500 : T.grey700;
  const bg = group.tone === "primary" ? T.blue50 : group.tone === "warning" ? T.orange50 : T.grey50;
  return (
    <div style={{background:bg,borderRadius:12,padding:"12px 13px",minWidth:0}}>
      <p style={{margin:"0 0 8px",fontSize:13,lineHeight:"18px",fontWeight:800,color}}>{group.label}</p>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {group.items.map(item => (
          <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <span style={{fontSize:13,lineHeight:"18px",fontWeight:700,color:item.registered ? T.grey800 : T.grey400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</span>
            <span style={{fontSize:12,lineHeight:"17px",fontWeight:800,color:item.qty ? color : T.grey500,whiteSpace:"nowrap"}}>
              {item.qty ? `${item.qty}${item.unit}` : "필요시"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ title, sub, value, tone = "default", action }) {
  const color = tone === "danger" ? T.red500 : tone === "warning" ? T.orange500 : tone === "success" ? T.green500 : T.grey900;
  const bg = tone === "danger" ? T.red50 : tone === "warning" ? T.orange50 : tone === "success" ? T.green50 : T.grey50;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0"}}>
      <div style={{width:8,height:34,borderRadius:9999,background:bg,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:700,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        <p style={{margin:"2px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</p>
        {action && <p style={{margin:"2px 0 0",fontSize:12,lineHeight:"17px",fontWeight:700,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>다음 행동: {action}</p>}
      </div>
      <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color,whiteSpace:"nowrap"}}>{value}</p>
    </div>
  );
}

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
  const compactDateTimeInputStyle = {
    height: 46,
    minWidth: 0,
    padding: "10px 12px",
    fontSize: 15,
  };
  const riskSubText = surgeryInsights.focusRows.length === 0
    ? "예정 수술 등록 후 확인"
    : surgeryInsights.riskCount
      ? "부족 이유와 보충 행동 표시"
      : "부족 품목 없이 준비 가능";
  const usageSubText = surgeryInsights.hasUsageData
    ? surgeryInsights.usageDelta === 0
      ? "실사용이 예상과 일치"
      : surgeryInsights.usageDelta > 0
        ? "초과 사용 원인 확인 필요"
        : "예상보다 적게 사용"
    : "확정된 사용량이 아직 없음";
  const projectedRiskCount = surgeryInsights.weeklyProjectedStockRows.length;
  const newShortageCount = surgeryInsights.weeklyProjectedStockRows.filter(row => row.isNewShortage).length;
  const projectedRiskSubText = surgeryInsights.weeklyPlannedCount
    ? projectedRiskCount
      ? `수술 영향 신규 ${newShortageCount}종`
      : "최소재고 미달 예상 없음"
    : "이번 주 예정 수술 없음";

  return (
    <>
      <SecTitle>수술 운영 요약</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(132px, 1fr))",gap:8,marginBottom:14}}>
          <MetricTile label={`${surgeryInsights.totalLabel} 수술`} value={`${surgeryInsights.focusRows.length}건`} sub={`등록 ${surgeryInsights.summaries.length}건`} Icon={CalendarDays} color={T.blue500} bg={T.blue50}/>
          <MetricTile label="예상 재료비" value={compactMoney(surgeryInsights.expectedTotal)} sub={surgeryInsights.unpricedCount ? `가격 미등록 ${surgeryInsights.unpricedCount}종 제외` : "최저 단가 기준"} Icon={Coins} color={T.grey900}/>
          <MetricTile label="준비 리스크" value={`${surgeryInsights.riskCount}건`} sub={riskSubText} Icon={AlertTriangle} color={surgeryInsights.riskCount ? T.red500 : T.green500} bg={surgeryInsights.riskCount ? T.red50 : T.green50}/>
          <MetricTile label="수술 후 재고" value={projectedRiskCount ? `${projectedRiskCount}종` : "안정"} sub={projectedRiskSubText} Icon={PackageCheck} color={projectedRiskCount ? T.orange500 : T.green500} bg={projectedRiskCount ? T.orange50 : T.green50}/>
          <MetricTile label="실사용 차이" value={surgeryInsights.hasUsageData ? `${surgeryInsights.usageDelta >= 0 ? "+" : ""}${compactMoney(surgeryInsights.usageDelta)}` : "대기"} sub={usageSubText} Icon={TrendingUp} color={surgeryInsights.usageDelta > 0 ? T.orange500 : T.green500}/>
        </div>

        <div style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${T.grey100}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div style={{minWidth:0}}>
              <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900}}>수술 후 예상 재고</p>
              <p style={{margin:"2px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500}}>수술 때문에 부족해질 품목 Top 리스트와 required_items 차감 후 최소재고 미달 예측</p>
            </div>
            <span style={{borderRadius:9999,padding:"5px 10px",background:projectedRiskCount ? T.orange50 : T.green50,color:projectedRiskCount ? T.orange500 : T.green500,fontSize:13,lineHeight:"18px",fontWeight:800,whiteSpace:"nowrap"}}>
              {projectedRiskCount ? `Top ${Math.min(4, projectedRiskCount)}` : "미달 없음"}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:10}}>
            <div style={{minWidth:0}}>
              <p style={{margin:"0 0 7px",fontSize:13,lineHeight:"18px",fontWeight:800,color:T.grey700}}>오늘 예정 수술 후</p>
              {surgeryInsights.todayProjectedStockRows.length === 0 ? (
                <div style={{borderRadius:12,background:T.green50,padding:"12px 13px"}}>
                  <p style={{margin:0,fontSize:14,lineHeight:"20px",fontWeight:800,color:T.green500}}>최소재고 유지</p>
                  <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600}}>
                    {surgeryInsights.todayPlannedCount ? "오늘 수술 차감 후에도 미달 예상 품목이 없어요." : "오늘 예정 수술이 없어요."}
                  </p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {surgeryInsights.todayProjectedStockRows.slice(0, 3).map(row => <ProjectedStockRow key={row.id} row={row}/>)}
                </div>
              )}
            </div>
            <div style={{minWidth:0}}>
              <p style={{margin:"0 0 7px",fontSize:13,lineHeight:"18px",fontWeight:800,color:T.grey700}}>이번 주 누적 수술 후</p>
              {surgeryInsights.weeklyProjectedStockRows.length === 0 ? (
                <div style={{borderRadius:12,background:T.green50,padding:"12px 13px"}}>
                  <p style={{margin:0,fontSize:14,lineHeight:"20px",fontWeight:800,color:T.green500}}>부족 전환 없음</p>
                  <p style={{margin:"3px 0 0",fontSize:12,lineHeight:"17px",color:T.grey600}}>
                    {surgeryInsights.weeklyPlannedCount ? "이번 주 예정 수술 차감 후 최소재고를 유지해요." : "이번 주 예정 수술이 없어요."}
                  </p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {surgeryInsights.weeklyProjectedStockRows.slice(0, 4).map(row => <ProjectedStockRow key={row.id} row={row}/>)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:14}}>
          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>고비용 수술</p>
            {surgeryInsights.highCostRows.length === 0 ? (
              <p style={{margin:0,padding:"12px 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>가격이 등록된 수술 품목이 아직 없어요.</p>
            ) : surgeryInsights.highCostRows.map((summary, index) => (
              <div key={summary.surgery.id}>
                <SummaryRow
                  title={summary.surgery.title}
                  sub={`${summary.surgery.scheduled_date} ${summary.surgery.scheduled_time} · 품목 ${summary.requiredRows.length}개`}
                  value={formatMoney(summary.expectedCost)}
                  tone={summary.shortageCount ? "danger" : "default"}
                />
                {index < surgeryInsights.highCostRows.length - 1 && <Divider/>}
              </div>
            ))}
          </div>

          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>준비 리스크</p>
            {surgeryInsights.riskRows.length === 0 ? (
              <p style={{margin:0,padding:"12px 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>부족 품목이 없어 예정 수술 준비가 안정적이에요. 다음 행동: 일정 전 최종 확인만 하면 돼요.</p>
            ) : surgeryInsights.riskRows.map((summary, index) => {
              const guidance = buildSurgeryGuidance(summary);
              return (
                <div key={summary.surgery.id}>
                  <SummaryRow
                    title={summary.surgery.title}
                    sub={guidance.reason}
                    value={`부족 ${summary.shortageCount}종`}
                    tone="danger"
                    action={guidance.action}
                  />
                  {index < surgeryInsights.riskRows.length - 1 && <Divider/>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.grey100}`}}>
          <p style={{margin:"0 0 6px",fontSize:14,lineHeight:"20px",fontWeight:800,color:T.grey800}}>예상 vs 실사용</p>
          {surgeryInsights.usageRows.length === 0 ? (
            <p style={{margin:0,padding:"8px 0 0",fontSize:14,lineHeight:"20px",color:T.grey500}}>확정된 사용량이 아직 없어요. 다음 행동: 수술 후 실제 사용량을 입력하면 차이를 바로 확인할 수 있어요.</p>
          ) : (
            surgeryInsights.usageRows.map((summary, index) => {
              const isOver = summary.deltaCost > 0;
              const isSame = summary.deltaCost === 0;
              const guidance = buildSurgeryGuidance(summary);
              return (
                <div key={summary.surgery.id}>
                  <SummaryRow
                    title={summary.surgery.title}
                    sub={`예상 ${formatMoney(summary.expectedCost)} · 실사용 ${formatMoney(summary.actualCost)}`}
                    value={isSame ? "동일" : `${isOver ? "+" : "-"}${formatMoney(Math.abs(summary.deltaCost))}`}
                    tone={isSame ? "success" : isOver ? "warning" : "success"}
                    action={guidance.action}
                  />
                  {index < surgeryInsights.usageRows.length - 1 && <Divider/>}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <SecTitle>수술 준비 묶음</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:12,background:surgeryInsights.bulkShortageRows.length ? T.orange50 : T.green50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {surgeryInsights.bulkShortageRows.length ? <ShoppingCart size={20} color={T.orange500}/> : <CheckCircle2 size={21} color={T.green500}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:16,lineHeight:"22px",fontWeight:800,color:T.grey900}}>이번 주 수술 부족 품목</p>
            <p style={{margin:"3px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500}}>
              {surgeryInsights.weeklyPrepCount ? `준비 전 수술 ${surgeryInsights.weeklyPrepCount}건 기준` : "이번 주 준비 전 수술이 없어요"}
            </p>
          </div>
          <span style={{borderRadius:9999,padding:"5px 10px",background:surgeryInsights.bulkShortageRows.length ? T.orange50 : T.green50,color:surgeryInsights.bulkShortageRows.length ? T.orange500 : T.green500,fontSize:13,lineHeight:"18px",fontWeight:800,whiteSpace:"nowrap"}}>
            {surgeryInsights.bulkShortageRows.length ? `${surgeryInsights.bulkShortageRows.length}종 부족` : "준비 안정"}
          </span>
        </div>

        {surgeryInsights.bulkShortageRows.length === 0 ? (
          <div style={{borderRadius:12,background:T.green50,padding:"13px 14px"}}>
            <p style={{margin:0,fontSize:14,lineHeight:"20px",fontWeight:800,color:T.green500}}>부족 품목 없이 준비 가능</p>
            <p style={{margin:"3px 0 0",fontSize:13,lineHeight:"18px",color:T.grey600}}>이번 주 수술 준비 목록 기준으로 현재 재고가 충분해요.</p>
          </div>
        ) : (
          <>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {surgeryInsights.bulkShortageRows.slice(0, 4).map(row => (
                <div key={row.id} style={{border:`1px solid ${T.orange500}33`,background:T.orange50,borderRadius:12,padding:"12px 13px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
                    <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.item?.name || "삭제된 품목"}</p>
                    <span style={{fontSize:14,lineHeight:"20px",fontWeight:800,color:T.orange500,whiteSpace:"nowrap"}}>{row.shortageQty}{row.unit} 부족</span>
                  </div>
                  <p style={{margin:0,fontSize:13,lineHeight:"18px",color:T.grey600}}>
                    필요 {row.requiredQty}{row.unit} · 현재 {row.currentQty}{row.unit} · {row.surgeryTitles.slice(0, 2).join(", ")}{row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={openSurgeryBulkOrder}
              disabled={!openModal}
              style={{width:"100%",minHeight:50,borderRadius:9999,border:"none",background:openModal ? T.blue500 : T.grey200,color:openModal ? T.white : T.grey500,fontFamily:font,fontSize:16,fontWeight:800,cursor:openModal ? "pointer" : "default",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}
            >
              <ShoppingCart size={18}/>
              수술 부족 품목 일괄 발주
            </button>
            <p style={{margin:"8px 0 0",fontSize:12,lineHeight:"17px",color:T.grey500}}>발주 모달에서 필요한 품목만 남기고 수량을 조정하세요.</p>
          </>
        )}
      </Card>

      <SecTitle>수술 일정 등록</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <p style={{margin:"0 0 8px",fontSize: 16,fontWeight:600,color:T.grey700}}>수술 유형</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          {Object.entries(SURGERY_PRESETS).map(([id,p])=>(
            <button key={id} onClick={()=>{setType(id); setTitle(p.label);}} style={{padding:"14px 0",borderRadius:9999,border:"none",background:type===id?T.blue500:T.grey100,color:type===id?T.white:T.grey700,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font}}>{p.label}</button>
          ))}
        </div>
        <div style={{border:`1px solid ${T.grey100}`,borderRadius:14,padding:14,marginBottom:14,background:T.white}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
            <ListChecks size={18} color={T.blue500}/>
            <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900}}>{preset.label} 준비 체크리스트 템플릿</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(142px, 1fr))",gap:8}}>
            {templateGroups.map(group => <TemplateChecklistGroup key={group.label} group={group}/>)}
          </div>
        </div>
        <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>수술명</p>
        <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 오전 임플란트 수술" style={{marginBottom:10}}/>
        <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>환자명</p>
        <Inp value={patient} onChange={e=>setPatient(e.target.value)} placeholder="예: 홍길동" style={{marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(132px, 1fr))",gap:10,marginBottom:10}}>
          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>날짜</p>
            <Inp value={date} onChange={e=>setDate(e.target.value)} type="date" style={compactDateTimeInputStyle}/>
          </div>
          <div style={{minWidth:0}}>
            <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>시간</p>
            <Inp value={time} onChange={e=>setTime(e.target.value)} type="time" style={compactDateTimeInputStyle}/>
          </div>
        </div>
        <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>메모</p>
        <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 픽스처 사이즈 확인" style={{marginBottom:14}}/>

        <div style={{background:T.grey50,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}}>
            <p style={{margin:0,fontSize: 16,fontWeight:700,color:T.grey700}}>예상 준비 품목{draftCustomized&&<span style={{marginLeft:6,fontSize: 16,fontWeight:600,color:T.blue500}}>· 사용자 편집</span>}</p>
            <div style={{display:"flex",gap:8}}>
              {draftCustomized&&<button onClick={resetDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize: 16,color:T.grey500,fontFamily:font,fontWeight:600}}>기본값</button>}
              <button onClick={editDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize: 16,color:T.blue500,fontFamily:font,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Edit2 size={16}/>편집</button>
            </div>
          </div>
          {draftItems.length===0 ? (
            <p style={{margin:0,padding:"6px 0",fontSize: 16,color:T.grey500}}>품목이 비어 있어요. "편집"으로 추가하세요.</p>
          ) : draftItems.map((req,i)=>{
            const item = items.find(it=>it.id===req.item_id);
            const enough = item && item.current_qty>=req.qty;
            return (
              <div key={req.item_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:i===0?"0 0 7px":i===draftItems.length-1?"7px 0 0":"7px 0",borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                <span style={{fontSize: 16,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</span>
                <span style={{fontSize: 16,fontWeight:700,color:enough?T.green500:T.red500,whiteSpace:"nowrap"}}>{req.qty}{item?.unit||""}</span>
              </div>
            );
          })}
        </div>
        <button onClick={submit} style={{width:"100%",padding:"18px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize: 16,fontWeight:600,cursor:"pointer",fontFamily:font}}>수술 일정 등록</button>
      </Card>

      <SecTitle>예정 수술</SecTitle>
      <Card>
        {sortedSurgeries.length===0 ? (
          <p style={{margin:0,padding:"28px 20px",fontSize: 16,color:T.grey500,textAlign:"center"}}>예정 수술이 없어요.</p>
        ) : sortedSurgeries.map((s,i)=>{
          const summary = surgeryInsights.summaries.find(row => row.surgery.id === s.id) || { surgery:s, expectedCost:0, actualCost:0, deltaCost:0, hasActual:false, shortageRows:[], shortageCount:0, statusLabel:"준비전", statusColor:T.orange500, statusBg:T.orange50, unpricedCount:0 };
          const statusTone = summary.shortageCount ? T.red500 : summary.statusColor;
          const guidance = buildSurgeryGuidance(summary);
          const usageText = summary.hasActual
            ? `실사용 ${formatMoney(summary.actualCost)} · ${summary.deltaCost === 0 ? "예상 동일" : `${summary.deltaCost > 0 ? "초과" : "절감"} ${formatMoney(Math.abs(summary.deltaCost))}`}`
            : summary.shortageCount
              ? `부족 ${summary.shortageCount}종 확인 필요`
              : "준비 리스크 없음";
          return (
          <div key={s.id}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"18px 20px"}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.prep_confirmed?T.green50:T.blue50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {s.usage_confirmed?<PackageCheck size={20} color={T.green500}/>:s.prep_confirmed?<ClipboardCheck size={20} color={T.orange500}/>:<CalendarDays size={20} color={T.blue500}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize: 16,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                <p style={{margin:"2px 0 0",fontSize: 16,color:T.grey500}}>{s.scheduled_date} {s.scheduled_time} · {s.patient} · 품목 {s.required_items.length}개</p>
                <p style={{margin:"4px 0 0",fontSize: 13,lineHeight:"18px",fontWeight:700,color:statusTone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  예상 {formatMoney(summary.expectedCost)} · {usageText}{summary.unpricedCount ? ` · 가격 미등록 ${summary.unpricedCount}종` : ""}
                </p>
                <p style={{margin:"3px 0 0",fontSize: 13,lineHeight:"18px",fontWeight:700,color:guidance.tone,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {guidance.prefix}: {guidance.reason} · 다음: {guidance.action}
                </p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <Chip label={summary.statusLabel} color={summary.statusColor} bg={summary.statusBg} border={T.grey200}/>
                {!s.prep_confirmed&&(
                  <button
                    aria-label={`${s.title} 품목 편집`}
                    onClick={()=>openItemsEditor(s.required_items, (newItems)=>updateSurgeryItems(s.id, newItems), `${s.scheduled_date} ${s.scheduled_time} · ${s.title}`)}
                    title="품목 편집"
                    style={{border:"none",background:T.grey100,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
                  ><Edit2 size={18} color={T.grey700}/></button>
                )}
                <button
                  aria-label={`${s.title} 삭제`}
                  onClick={()=>removeSurgery(s)}
                  title="수술 삭제"
                  style={{border:"none",background:T.red50,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
                ><Trash2 size={16} color={T.red500}/></button>
              </div>
            </div>
            {i<sortedSurgeries.length-1&&<Divider/>}
          </div>
          );
        })}
      </Card>
    </>
  );
}
