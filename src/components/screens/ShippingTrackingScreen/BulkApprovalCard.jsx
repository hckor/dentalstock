import { CheckCircle2 } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";

export function BulkApprovalCard({ selectedCount, totalCount, onToggleAll, onApprove }) {
  return (
    <Card style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={onToggleAll}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9999,
            border: `1px solid ${selectedCount ? T.primary : T.grey300}`,
            background: selectedCount ? T.primary : T.white,
            color: T.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label={selectedCount === totalCount ? "전체 선택 해제" : "전체 선택"}
        >
          {selectedCount > 0 && <CheckCircle2 size={20} color={T.white} strokeWidth={3} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.grey900 }}>일괄 승인</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: T.grey500 }}>
            {selectedCount}건 선택됨 · 승인 후 진행중으로 이동합니다
          </p>
        </div>
        <button
          type="button"
          onClick={onApprove}
          disabled={!selectedCount}
          style={{
            minHeight: 42,
            padding: "10px 15px",
            borderRadius: 9999,
            border: "none",
            background: selectedCount ? T.primary : T.grey200,
            color: selectedCount ? T.white : T.grey500,
            fontFamily: font,
            fontSize: 14,
            fontWeight: 700,
            cursor: selectedCount ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {selectedCount}건 승인
        </button>
      </div>
    </Card>
  );
}
