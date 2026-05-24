import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, Package, ShieldCheck, Stethoscope } from "lucide-react";
import { auditLogsApi } from "../../../api/auditLogsApi";
import { T, font, monoFont } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";
import { fmtFull } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Chip } from "../../shared/Chip";
import { Divider } from "../../shared/Divider";

const filters = [
  { id: "all", label: "전체", Icon: Activity },
  { id: "stock", label: "입출고", Icon: Package },
  { id: "order", label: "발주", Icon: ClipboardCheck },
  { id: "surgery", label: "수술", Icon: Stethoscope },
  { id: "security", label: "보안", Icon: ShieldCheck },
];

const actionMeta = {
  "stock.in": { label: "입고 등록", color: T.primary, bg: T.primaryBg },
  "stock.out": { label: "출고 등록", color: T.danger, bg: T.dangerBg },
  "stock.adjust": { label: "재고 보정", color: T.grey700, bg: T.grey100 },
  "order.requested": { label: "발주 요청", color: ORDER_ST.pending.text, bg: ORDER_ST.pending.bg },
  "order.approved": { label: "발주 승인", color: ORDER_ST.ordered.text, bg: ORDER_ST.ordered.bg },
  "order.rejected": { label: "발주 반려", color: ORDER_ST.rejected.text, bg: ORDER_ST.rejected.bg },
  "order.tracking_registered": { label: "송장 등록", color: ORDER_ST.ordered.text, bg: ORDER_ST.ordered.bg },
  "order.tracking_refreshed": { label: "배송 갱신", color: ORDER_ST.ordered.text, bg: ORDER_ST.ordered.bg },
  "order.delivered": { label: "배달완료", color: ORDER_ST.received.text, bg: ORDER_ST.received.bg },
  "order.received": { label: "입고 확인", color: ORDER_ST.received.text, bg: ORDER_ST.received.bg },
  "surgery.created": { label: "수술 등록", color: T.primary, bg: T.primaryBg },
  "surgery.prep_confirmed": { label: "수술 준비확인", color: T.success, bg: T.successBg },
  "surgery.usage_confirmed": { label: "수술 사용확인", color: T.success, bg: T.successBg },
  "surgery.items_updated": { label: "수술 품목수정", color: T.grey700, bg: T.grey100 },
  "surgery.deleted": { label: "수술 삭제", color: T.danger, bg: T.dangerBg },
};

function getCategory(action) {
  if (action.startsWith("stock.")) return "stock";
  if (action.startsWith("order.")) return "order";
  if (action.startsWith("surgery.")) return "surgery";
  return "security";
}

function formatAuditTime(value) {
  if (!value) return "시간 정보 없음";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return fmtFull(value);
}

function metadataLine(metadata = {}) {
  const pieces = [];
  if (metadata.item_name) pieces.push(metadata.item_name);
  if (metadata.qty) pieces.push(`${metadata.qty}개`);
  if (metadata.received_qty) pieces.push(`입고 ${metadata.received_qty}`);
  if (metadata.before_qty !== undefined && metadata.after_qty !== undefined) {
    pieces.push(`${metadata.before_qty} → ${metadata.after_qty}`);
  }
  if (metadata.shipping_status) pieces.push(metadata.shipping_status);
  if (metadata.carrier) pieces.push(metadata.carrier);
  if (metadata.tracking_number_last4) pieces.push(`송장 끝 ${metadata.tracking_number_last4}`);
  if (metadata.required_count !== undefined) pieces.push(`준비품목 ${metadata.required_count}개`);
  if (metadata.used_count !== undefined) pieces.push(`사용품목 ${metadata.used_count}개`);
  if (metadata.used_items) pieces.push(metadata.used_items);
  if (metadata.before_count !== undefined && metadata.after_count !== undefined) {
    pieces.push(`품목 ${metadata.before_count} → ${metadata.after_count}`);
  }
  if (metadata.scheduled_date) pieces.push(metadata.scheduled_date);
  if (metadata.note) pieces.push(metadata.note);
  if (metadata.review_note) pieces.push(metadata.review_note);
  return pieces.join(" · ") || "세부 정보 없음";
}

function AuditRow({ log, isLast }) {
  const meta = actionMeta[log.action] || { label: log.action, color: T.grey700, bg: T.grey100 };

  return (
    <div>
      <div style={{ padding: "16px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: meta.color, marginTop: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <Chip label={meta.label} color={meta.color} bg={meta.bg} />
            <span style={{ flexShrink: 0, fontSize: 12, color: T.grey500, fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>
              {formatAuditTime(log.created_at)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.grey900, lineHeight: "22px" }}>
            {log.actor?.name || "system"}
            <span style={{ color: T.grey500, fontWeight: 500 }}> · {log.entity_type} #{log.entity_id}</span>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: T.grey600, lineHeight: "20px", wordBreak: "keep-all", overflowWrap: "anywhere" }}>
            {metadataLine(log.metadata)}
          </p>
        </div>
      </div>
      {!isLast && <Divider />}
    </div>
  );
}

export function ActivityLogTab() {
  const [filter, setFilter] = useState("all");
  const logs = auditLogsApi.list();
  const filteredLogs = useMemo(
    () => logs.filter(log => filter === "all" || getCategory(log.action) === filter),
    [filter, logs]
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
        {filters.map(({ id, label, Icon }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              style={{
                flexShrink: 0,
                border: "none",
                borderRadius: 9999,
                padding: "9px 13px",
                background: active ? T.primary : T.white,
                color: active ? T.white : T.grey600,
                fontFamily: font,
                fontSize: 14,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {filteredLogs.length === 0 ? (
        <Card style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 9999, background: T.grey100, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Activity size={26} color={T.grey400} />
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: T.grey800 }}>아직 기록이 없어요</p>
          <p style={{ margin: 0, fontSize: 14, color: T.grey500, lineHeight: "20px" }}>입출고, 발주, 수술 변경을 처리하면 여기에 남습니다.</p>
        </Card>
      ) : (
        <Card style={{ padding: "0 18px" }}>
          {filteredLogs.map((log, index) => (
            <AuditRow key={log.id} log={log} isLast={index === filteredLogs.length - 1} />
          ))}
        </Card>
      )}
    </div>
  );
}
