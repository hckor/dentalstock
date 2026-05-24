import { ArrowLeft } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";

export function ManagementSectionHeader({ section, onBack }) {
  if (!section) return null;
  const Icon = section.Icon;
  return (
    <Card style={{ padding: 0, marginBottom: 12, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onBack}
        style={{ width: "100%", border: "none", background: T.white, color: T.grey700, padding: "13px 15px", fontSize: 14, lineHeight: "19px", fontWeight: 800, fontFamily: font, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, textAlign: "left" }}
      >
        <ArrowLeft size={17} />
        관리 메인
      </button>
      <Divider />
      <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: T.grey50, color: section.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={21} color="currentColor" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 900, color: T.grey900 }}>{section.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "20px", color: T.grey600, wordBreak: "keep-all" }}>{section.description}</p>
        </div>
        <span style={{ flexShrink: 0, maxWidth: 96, borderRadius: 9999, padding: "6px 9px", background: T.grey50, color: T.grey700, fontSize: 12, lineHeight: "16px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {section.detail}
        </span>
      </div>
    </Card>
  );
}
