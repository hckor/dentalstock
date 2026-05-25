import { Check, Plus } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Inp } from "../../shared/Inp";

export function CatalogGroupRow({
  group,
  selectedEntry,
  expandedGroupKey,
  setExpandedGroupKey,
  toggleGroup,
  changeGroupVariant,
  updateGroupSelection,
  handleMaterialQuantityChange,
  getVariantMaterial,
  getMaterialDisplayName,
  getDuplicateMatch,
}) {
  const selected = Boolean(selectedEntry);
  const expanded = expandedGroupKey === group.key || selected;
  const activeVariantKey = selectedEntry?.variantKey || group.variants[0]?.key;
  const previewMaterial = getVariantMaterial(group, activeVariantKey);
  const savedName = getMaterialDisplayName(previewMaterial);
  const duplicateMatch = getDuplicateMatch(savedName);
  const exists = duplicateMatch?.kind === "exact";
  const displaySpec = group.variants.length > 1
    ? `규격 ${group.variants.length}개`
    : group.variants[0]?.label === "기본"
      ? "기본 규격"
      : group.variants[0]?.label;

  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.grey100}` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <button
          type="button"
          onClick={() => toggleGroup(group)}
          disabled={exists && !selected}
          style={{
            width: 30,
            height: 30,
            marginTop: 2,
            borderRadius: 9999,
            border: `1px solid ${selected ? T.blue500 : T.grey300}`,
            background: selected ? T.blue500 : T.white,
            color: T.white,
            cursor: exists && !selected ? "not-allowed" : "pointer",
            opacity: exists && !selected ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label={selected ? "선택 해제" : "품목 선택"}
        >
          {selected ? <Check size={17} strokeWidth={3} /> : <Plus size={16} />}
        </button>

        <button
          type="button"
          onClick={() => setExpandedGroupKey(expanded ? "" : group.key)}
          style={{ flex: 1, minWidth: 0, padding: 0, border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontFamily: font }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.blue500, background: T.blue50, borderRadius: 9999, padding: "2px 7px" }}>
              {group.category}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.grey600, background: T.grey100, borderRadius: 9999, padding: "2px 7px" }}>
              {group.type}
            </span>
            {exists && !selected && (
              <span style={{ fontSize: 12, fontWeight: 800, color: T.green500, background: T.green50, borderRadius: 9999, padding: "2px 7px" }}>
                이미 있음
              </span>
            )}
            {duplicateMatch?.kind === "similar" && !selected && (
              <span style={{ fontSize: 12, fontWeight: 800, color: T.orange500, background: T.orange50, borderRadius: 9999, padding: "2px 7px" }}>
                비슷함
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.grey900, lineHeight: 1.35 }}>
            {group.representativeName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.grey500, lineHeight: 1.45 }}>
            {[displaySpec, `판매처 ${Math.max(group.vendorCount, 1)}곳`, group.unit].filter(Boolean).join(" · ")}
          </p>
        </button>
      </div>

      {expanded && (
        <div style={{ margin: "12px 0 2px 40px", padding: 12, borderRadius: 16, background: T.grey50 }}>
          {group.variants.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 800, color: T.grey600 }}>
                규격
              </label>
              <select
                value={activeVariantKey}
                onChange={(event) => changeGroupVariant(group, event.target.value)}
                style={{ width: "100%", height: 44, border: `1px solid ${T.grey200}`, borderRadius: 12, background: T.white, color: T.grey900, fontFamily: font, fontSize: 14, fontWeight: 700, padding: "0 12px", outline: "none" }}
              >
                {group.variants.map(variant => (
                  <option key={variant.key} value={variant.key}>
                    {variant.label} · 판매처 {Math.max(variant.vendorCount, 1)}곳
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 96px", gap: 8, alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 13, color: T.grey500, lineHeight: 1.45 }}>
              선택하면 품목명은 <strong style={{ color: T.grey800 }}>{savedName}</strong>으로 저장됩니다.
              {duplicateMatch?.kind === "similar" && (
                <span style={{ color: T.orange500, fontWeight: 800 }}> 비슷한 품목: {duplicateMatch.item.name}</span>
              )}
            </p>
            {selected ? (
              <Inp
                type="number"
                value={selectedEntry.quantity}
                onChange={(event) => handleMaterialQuantityChange(selectedEntry.variantKey, event.target.value)}
                placeholder="1"
                style={{ height: 42, textAlign: "right" }}
              />
            ) : (
              <button
                type="button"
                onClick={() => updateGroupSelection(group)}
                disabled={exists}
                style={{ height: 42, border: "none", borderRadius: 12, background: exists ? T.grey200 : T.blue500, color: T.white, fontFamily: font, fontSize: 14, fontWeight: 800, cursor: exists ? "not-allowed" : "pointer" }}
              >
                선택
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
