import { useEffect, useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Search, X } from "lucide-react";
import { T, font } from "../../constants/colors";
import {
  filterPreparedMaterialCatalogGroups,
  getMaterialDisplayName,
  materialToInventoryItem,
} from "../../utils/dentalMaterialCatalog";
import { findSimilarInventoryItem } from "../../utils/itemIdentity";
import { Inp } from "../shared/Inp";

const segmentStyle = {
  flex: 1,
  height: 42,
  border: "none",
  borderRadius: 12,
  fontFamily: font,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const filterChipStyle = (active) => ({
  flexShrink: 0,
  height: 36,
  padding: "0 14px",
  borderRadius: 9999,
  border: `1px solid ${active ? T.blue500 : T.grey200}`,
  background: active ? T.blue500 : T.white,
  color: active ? T.white : T.grey700,
  fontFamily: font,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

export function InitialInventoryModal({ items, onSave, onClose }) {
  const [tab, setTab] = useState("catalog");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [catalogData, setCatalogData] = useState({
    summary: { rawItemCount: 0, groupCount: 0 },
    categoryOptions: [],
    typeOptionsByCategory: {},
    materialsById: new Map(),
    groups: [],
  });
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.current_qty ?? 0 }), {})
  );
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [expandedGroupKey, setExpandedGroupKey] = useState("");

  const getDuplicateMatch = useMemo(
    () => (name) => findSimilarInventoryItem(items, name),
    [items]
  );
  const temporaryDuplicateMatch = useMemo(
    () => query.trim() ? getDuplicateMatch(query.trim()) : null,
    [getDuplicateMatch, query]
  );

  useEffect(() => {
    let mounted = true;

    import("../../data/dentalMaterialCatalogPrepared.js")
      .then((preparedCatalog) => {
        if (!mounted) return;
        setCatalogData({
          summary: preparedCatalog.DENTAL_MATERIAL_CATALOG_SUMMARY,
          categoryOptions: preparedCatalog.DENTAL_MATERIAL_CATALOG_CATEGORY_OPTIONS,
          typeOptionsByCategory: preparedCatalog.DENTAL_MATERIAL_CATALOG_TYPE_OPTIONS_BY_CATEGORY,
          materialsById: new Map(preparedCatalog.DENTAL_MATERIAL_CATALOG_MATERIALS.map(material => [material.catalog_id, material])),
          groups: preparedCatalog.DENTAL_MATERIAL_CATALOG_GROUPS,
        });
        setCatalogStatus("ready");
      })
      .catch(() => {
        if (!mounted) return;
        setCatalogStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = catalogData.categoryOptions;
  const typeOptions = useMemo(
    () => categoryFilter ? catalogData.typeOptionsByCategory[categoryFilter] || [] : [],
    [catalogData.typeOptionsByCategory, categoryFilter]
  );
  const filteredGroups = useMemo(
    () => filterPreparedMaterialCatalogGroups(catalogData.groups, { query, category: categoryFilter, type: typeFilter }, 80, catalogData.materialsById),
    [catalogData.groups, catalogData.materialsById, categoryFilter, query, typeFilter]
  );

  const selectedCount = Object.keys(selectedMaterials).length;
  const zeroQuantitySelectedCount = Object.values(selectedMaterials)
    .filter(({ quantity }) => !Number(quantity))
    .length;
  const hasCatalogFilter = Boolean(query.trim() || categoryFilter || typeFilter);
  const shouldShowCatalogResults = hasCatalogFilter;

  const resetCatalogFilters = () => {
    setQuery("");
    setCategoryFilter("");
    setTypeFilter("");
  };

  const changeCategory = (nextCategory) => {
    setCategoryFilter(nextCategory);
    setTypeFilter("");
    setExpandedGroupKey("");
  };

  const handleQuantityChange = (itemId, value) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, parseInt(value, 10) || 0),
    }));
  };

  const getVariantMaterial = (group, variantKey) => {
    const variant = group.variants.find(option => option.key === variantKey) || group.variants[0];
    return catalogData.materialsById.get(variant?.material_id) || {};
  };

  const updateGroupSelection = (group, patch = {}) => {
    const variantKey = patch.variantKey || group.variants[0]?.key || group.key;
    const material = getVariantMaterial(group, variantKey);
    const key = variantKey;
    setSelectedMaterials(prev => {
      const previous = prev[key] || {};
      return {
        ...prev,
        [key]: {
          material,
          quantity: patch.quantity ?? previous.quantity ?? 1,
          groupKey: group.key,
          variantKey,
        },
      };
    });
  };

  const toggleGroup = (group) => {
    const variantKey = group.variants[0]?.key || group.key;
    setExpandedGroupKey(group.key);
    setSelectedMaterials(prev => {
      if (prev[variantKey]) {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key].groupKey === group.key) delete next[key];
        });
        return next;
      }
      const material = getVariantMaterial(group, variantKey);
      return {
        ...prev,
        [variantKey]: { material, quantity: 1, groupKey: group.key, variantKey },
      };
    });
  };

  const selectedEntryForGroup = (group) => Object.values(selectedMaterials)
    .find(entry => entry.groupKey === group.key);

  const changeGroupVariant = (group, nextVariantKey) => {
    const previous = selectedEntryForGroup(group);
    setSelectedMaterials(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key].groupKey === group.key) delete next[key];
      });
      next[nextVariantKey] = {
        material: getVariantMaterial(group, nextVariantKey),
        quantity: previous?.quantity ?? 1,
        groupKey: group.key,
        variantKey: nextVariantKey,
      };
      return next;
    });
  };

  const handleMaterialQuantityChange = (key, value) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity: Math.max(0, parseInt(value, 10) || 0),
      },
    }));
  };

  const addTemporaryMaterial = () => {
    const name = query.trim();
    if (!name || getDuplicateMatch(name)?.kind === "exact") return;
    const key = `temporary-${Date.now()}`;
    setSelectedMaterials(prev => ({
      ...prev,
      [key]: {
        material: {
          catalog_id: key,
          name,
          display_name: name,
          app_display_name: name,
          category: "소모품",
          category_id: 1,
          unit: "개",
          min_order_qty: 1,
          is_temporary: true,
          temporary_status: "needs_review",
          temporary_reason: "카탈로그 검색 결과 없음",
          created_from: "initial_inventory",
        },
        quantity: 1,
        groupKey: key,
        variantKey: key,
      },
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    if (tab === "catalog" && selectedCount === 0) return;
    const newItems = Object.values(selectedMaterials).map(({ material, quantity }) => {
      const item = materialToInventoryItem(material, quantity);
      return material.is_temporary
        ? {
          ...item,
          is_temporary: true,
          temporary_status: "needs_review",
          temporary_reason: material.temporary_reason,
          created_from: material.created_from,
        }
        : item;
    });
    setSaving(true);
    const ok = await onSave({ quantities, newItems });
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <div style={{ padding: "16px 20px 0" }}>
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

      {tab === "catalog" && (
        <>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={18} color={T.grey400} style={{ position: "absolute", left: 14, top: 15 }} />
            <Inp
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품명, 코드, 제조사 검색"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 0 10px", marginBottom: 2 }}>
            <button
              type="button"
              onClick={() => changeCategory("")}
              style={filterChipStyle(!categoryFilter)}
            >
              전체 {catalogData.summary.groupCount || catalogData.summary.rawItemCount}
            </button>
            {categoryOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeCategory(option.value)}
                style={filterChipStyle(categoryFilter === option.value)}
              >
                {option.label} {option.count}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: hasCatalogFilter ? "1fr auto" : "1fr", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              disabled={!categoryFilter}
              style={{ width: "100%", height: 44, border: `1px solid ${T.grey200}`, borderRadius: 12, background: categoryFilter ? T.white : T.grey50, color: typeFilter ? T.grey900 : T.grey500, fontFamily: font, fontSize: 14, fontWeight: 700, padding: "0 12px", outline: "none", opacity: categoryFilter ? 1 : 0.9 }}
            >
              <option value="">
                {categoryFilter ? `종류 전체 (${typeOptions.length})` : "카테고리를 먼저 선택하세요"}
              </option>
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
              ))}
            </select>
            {hasCatalogFilter && (
              <button
                type="button"
                onClick={resetCatalogFilters}
                style={{ height: 44, minWidth: 44, border: "none", borderRadius: 12, background: T.grey100, color: T.grey600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="카탈로그 필터 초기화"
              >
                <RotateCcw size={17} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.grey500, fontWeight: 600 }}>
              {shouldShowCatalogResults
                ? `대표 품목 ${filteredGroups.total.toLocaleString("ko-KR")}개${filteredGroups.total > filteredGroups.items.length ? ` · 상위 ${filteredGroups.items.length}개 표시` : ""}`
                : "카테고리를 선택하거나 검색하면 대표 품목을 보여드려요"}
            </p>
            {typeFilter && (
              <button
                type="button"
                onClick={() => setTypeFilter("")}
                style={{ border: "none", background: "transparent", color: T.blue500, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                종류 해제
              </button>
            )}
          </div>

          <div style={{ maxHeight: "50vh", overflowY: "auto", marginBottom: 20 }}>
            {catalogStatus === "loading" ? (
              <div style={{ padding: "34px 12px", textAlign: "center", color: T.grey500, fontSize: 14, lineHeight: 1.5 }}>
                카탈로그를 불러오는 중이에요
              </div>
            ) : catalogStatus === "error" ? (
              <div style={{ padding: "34px 12px", textAlign: "center", color: T.red500, fontSize: 14, lineHeight: 1.5 }}>
                카탈로그를 불러오지 못했어요
              </div>
            ) : !shouldShowCatalogResults ? (
              <div style={{ padding: "30px 16px", borderRadius: 16, background: T.grey50, textAlign: "center", color: T.grey500, fontSize: 14, lineHeight: 1.5 }}>
                먼저 카테고리 하나를 고르거나 검색어를 입력해주세요.
              </div>
            ) : filteredGroups.items.length === 0 ? (
              <div style={{ padding: "28px 12px", textAlign: "center", color: T.grey500, fontSize: 14, lineHeight: 1.5 }}>
                <p style={{ margin: "0 0 12px" }}>조건에 맞는 카탈로그 품목이 없어요</p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={addTemporaryMaterial}
                    disabled={temporaryDuplicateMatch?.kind === "exact"}
                    style={{ border: "none", borderRadius: 9999, background: temporaryDuplicateMatch?.kind === "exact" ? T.grey200 : T.orange50, color: temporaryDuplicateMatch?.kind === "exact" ? T.grey500 : T.orange500, padding: "12px 16px", fontFamily: font, fontSize: 14, fontWeight: 800, cursor: temporaryDuplicateMatch?.kind === "exact" ? "default" : "pointer" }}
                  >
                    {temporaryDuplicateMatch?.kind === "exact" ? `이미 있음: ${temporaryDuplicateMatch.item.name}` : `"${query.trim()}" 임시 품목으로 담기`}
                  </button>
                )}
                {temporaryDuplicateMatch?.kind === "similar" && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "18px", color: T.orange500, fontWeight: 700 }}>
                    비슷한 품목이 있어요: {temporaryDuplicateMatch.item.name}
                  </p>
                )}
              </div>
            ) : filteredGroups.items.map(group => {
              const selectedEntry = selectedEntryForGroup(group);
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
                <div key={group.key} style={{ padding: "12px 0", borderBottom: `1px solid ${T.grey100}` }}>
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
            })}
          </div>
        </>
      )}

      {tab === "existing" && (
        <div style={{ maxHeight: "50vh", overflowY: "auto", marginBottom: 20 }}>
          {items.map((item) => (
            <div key={item.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 16, fontWeight: 600, color: T.grey900, margin: 0 }}>
                  {item.name}
                </label>
                <span style={{ fontSize: 16, color: T.grey500 }}>({item.unit})</span>
              </div>
              <Inp
                type="number"
                value={quantities[item.id]}
                onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                placeholder="수량 입력"
                style={{ fontSize: 16, padding: "14px 16px", height: 48 }}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "catalog" && selectedCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: T.blue50, marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.blue500 }}>
            선택 {selectedCount}개
          </p>
          <p style={{ margin: 0, fontSize: 13, color: zeroQuantitySelectedCount ? T.grey700 : T.grey500, fontWeight: 600 }}>
            {zeroQuantitySelectedCount ? `수량 미입력 ${zeroQuantitySelectedCount}개` : "수량 입력 완료"}
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || (tab === "catalog" && selectedCount === 0)}
        style={{ width: "100%", padding: "16px 0", borderRadius: 9999, border: "none", background: saving || (tab === "catalog" && selectedCount === 0) ? T.grey300 : T.blue500, color: T.white, fontSize: 16, fontWeight: 600, cursor: saving || (tab === "catalog" && selectedCount === 0) ? "default" : "pointer", fontFamily: font, marginBottom: 20 }}
      >
        {saving ? "저장 중..." : tab === "catalog" ? "선택 품목 저장" : "저장"}
      </button>
    </div>
  );
}
