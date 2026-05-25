export function mergeUpdatedItem(prevItems, updatedItem) {
  return prevItems.map(item => item.id === updatedItem.id ? { ...item, ...updatedItem } : item);
}

export function buildSurgeryUsageTxs({ usedRows, itemMap, surgery, surgeryId, note, currentUser, usageConfirmedAt }) {
  return usedRows.map((row, index) => {
    const item = itemMap.get(row.item_id);
    return {
      id: `t${Date.now()}-s${index}`,
      item_id: row.item_id,
      type: "out",
      qty: row.qty,
      note: `수술 실사용 확정 (${surgery.title})${note ? ` · ${note}` : ""}`,
      created_at: usageConfirmedAt,
      user: currentUser.name,
      surgery_id: surgeryId,
      item_name: item?.name,
    };
  });
}

export function buildSurgeryUsageAuditMetadata({ surgery, usedRows, itemMap, note }) {
  return {
    scheduled_date: surgery.scheduled_date,
    scheduled_time: surgery.scheduled_time,
    used_count: usedRows.length,
    used_items: usedRows.map(row => {
      const item = itemMap.get(row.item_id);
      return `${item?.name || row.item_id}:${row.qty}${item?.unit || ""}`;
    }).join(", "),
    note: note || "",
  };
}

export function buildSurgeryTodayNotification(surgery) {
  return {
    id: `n${Date.now()}`,
    type: "surgery_today",
    surgery_id: surgery.id,
    item_id: null,
    message: "오늘 예정된 수술 준비가 필요합니다",
    sub: `${surgery.title} · ${surgery.scheduled_time}`,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}
