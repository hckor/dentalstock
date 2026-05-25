import { useState } from "react";
import { ChevronDown, ExternalLink, Link as LinkIcon } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";

export function VendorProductLinksCard({ groups, onOpenGroup }) {
  const [expanded, setExpanded] = useState(false);
  if (!groups.length) return null;

  const totalLines = groups.reduce((sum, group) => sum + group.lines.length, 0);
  const openableCount = groups.reduce((sum, group) => sum + group.openableCount, 0);

  return (
    <Card style={{ padding: 0, marginTop: 4, marginBottom: 12, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        style={{ width: "100%", border: "none", background: T.white, padding: 14, fontFamily: font, cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9999, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ExternalLink size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: "20px", fontWeight: 900, color: T.grey900 }}>상품 링크</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "18px", color: T.grey500 }}>
              거래처 {groups.length}곳 · {totalLines}품목 · 열 수 있음 {openableCount}개
            </p>
          </div>
          <ChevronDown size={18} color={T.grey500} style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.grey100}`, padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(group => {
            const canOpen = group.openableCount > 0;
            return (
              <div key={group.id} style={{ border: `1px solid ${T.grey200}`, borderRadius: 12, padding: 12, background: T.grey50 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.grey900 }}>{group.vendorName}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: T.grey500 }}>
                      {group.lines.length}품목 · 열 수 있는 상품 {group.openableCount}개
                      {group.missingUrlCount > 0 && ` · URL 미등록 ${group.missingUrlCount}개`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canOpen}
                    onClick={() => onOpenGroup(group)}
                    style={{
                      minHeight: 40,
                      borderRadius: 9999,
                      border: "none",
                      background: canOpen ? T.blue500 : T.grey200,
                      color: canOpen ? T.white : T.grey500,
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: font,
                      cursor: canOpen ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "0 13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ExternalLink size={15} />
                    상품 열기
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {group.lines.map(line => (
                    <div key={line.orderId} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 9999, background: line.actionUrl ? T.blue500 : T.grey300, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.grey800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {line.itemName} {line.qty}{line.unit}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: T.grey500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {line.sku ? `SKU ${line.sku}` : "상품코드 미등록"}
                        </p>
                      </div>
                      {line.actionUrl ? (
                        <a
                          href={line.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${line.itemName} 거래처 상품 열기`}
                          style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9999, background: T.white, color: T.blue500, border: `1px solid ${T.grey200}`, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <LinkIcon size={15} />
                        </a>
                      ) : (
                        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: T.grey400 }}>URL 없음</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
