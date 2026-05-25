import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";

export function VendorProductLinksCard({ groups, onOpenGroup }) {
  if (!groups.length) return null;

  return (
    <Card style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9999, background: T.blue50, color: T.blue500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ExternalLink size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.grey900 }}>거래처 상품 링크</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.45, color: T.grey500 }}>
            승인된 발주의 상품 페이지를 거래처별로 열어줍니다. 장바구니 담기와 결제는 거래처 사이트에서 직접 진행하세요.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
    </Card>
  );
}
