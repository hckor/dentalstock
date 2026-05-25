import { X } from "lucide-react";
import { T } from "../../../constants/colors";
import { segmentStyle } from "./initialInventoryModal.styles";

export function InitialInventoryModalHeader({ onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.grey900 }}>초기 재고 설정</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: T.grey500 }}>
          카탈로그에서 품목을 고르고 시작 수량을 입력합니다
        </p>
      </div>
      <button
        onClick={onClose}
        style={{ width: 36, height: 36, border: "none", borderRadius: 9999, background: T.grey100, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <X size={20} color={T.grey500} />
      </button>
    </div>
  );
}

export function InitialInventoryModalTabs({ tab, setTab, selectedCount }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 16, background: T.grey100, marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setTab("catalog")}
        style={{ ...segmentStyle, background: tab === "catalog" ? T.white : "transparent", color: tab === "catalog" ? T.grey900 : T.grey500, boxShadow: tab === "catalog" ? T.shadowSelected : "none" }}
      >
        카탈로그 {selectedCount > 0 ? `${selectedCount}` : ""}
      </button>
      <button
        type="button"
        onClick={() => setTab("existing")}
        style={{ ...segmentStyle, background: tab === "existing" ? T.white : "transparent", color: tab === "existing" ? T.grey900 : T.grey500, boxShadow: tab === "existing" ? T.shadowSelected : "none" }}
      >
        기존 품목
      </button>
    </div>
  );
}

export function InitialInventorySelectionSummary({ selectedCount, zeroQuantitySelectedCount }) {
  if (selectedCount <= 0) return null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: T.blue50, marginBottom: 12 }}>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.blue500 }}>
        선택 {selectedCount}개
      </p>
      <p style={{ margin: 0, fontSize: 13, color: zeroQuantitySelectedCount ? T.grey700 : T.grey500, fontWeight: 600 }}>
        {zeroQuantitySelectedCount ? `수량 미입력 ${zeroQuantitySelectedCount}개` : "수량 입력 완료"}
      </p>
    </div>
  );
}

export function InitialInventorySaveButton({ tab, saving, selectedCount, onSave }) {
  const disabled = saving || (tab === "catalog" && selectedCount === 0);

  return (
    <button
      onClick={onSave}
      disabled={disabled}
      style={{ width: "100%", padding: "16px 0", borderRadius: 9999, border: "none", background: disabled ? T.grey300 : T.blue500, color: T.white, fontSize: 16, fontWeight: 600, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", marginBottom: 20 }}
    >
      {saving ? "저장 중..." : tab === "catalog" ? "선택 품목 저장" : "저장"}
    </button>
  );
}
