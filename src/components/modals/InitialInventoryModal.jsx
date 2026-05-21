import { useEffect, useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Search, X } from "lucide-react";
import { T, font } from "../../constants/colors";
import {
  cleanMaterialName,
  filterMaterials,
  getMaterialCategoryLabel,
  getMaterialCategoryOptions,
  getMaterialDisplayName,
  getMaterialTypeLabel,
  getMaterialTypeOptions,
  groupMaterialsByCategoryAndType,
  materialToInventoryItem,
} from "../../utils/dentalMaterialCatalog";
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

const materialKey = (material) => material.catalog_id || `${material.source}:${material.source_product_id || material.product_code}`;

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
  const [catalog, setCatalog] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.current_qty ?? 0 }), {})
  );
  const [selectedMaterials, setSelectedMaterials] = useState({});

  const existingNames = useMemo(
    () => new Set(items.map(item => String(item.name || "").trim().toLowerCase()).filter(Boolean)),
    [items]
  );

  useEffect(() => {
    let mounted = true;

    import("../../data/dentalMaterialCatalog.js")
      .then(({ DENTAL_MATERIAL_CATALOG }) => {
        if (!mounted) return;
        setCatalog(DENTAL_MATERIAL_CATALOG);
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

  const categoryOptions = useMemo(
    () => getMaterialCategoryOptions(catalog),
    [catalog]
  );
  const typeOptions = useMemo(
    () => categoryFilter ? getMaterialTypeOptions(catalog, categoryFilter) : [],
    [catalog, categoryFilter]
  );
  const filteredMaterials = useMemo(
    () => filterMaterials(catalog, { query, category: categoryFilter, type: typeFilter }, 80),
    [catalog, categoryFilter, query, typeFilter]
  );
  const visibleGroups = useMemo(
    () => groupMaterialsByCategoryAndType(filteredMaterials.items),
    [filteredMaterials.items]
  );

  const selectedCount = Object.keys(selectedMaterials).length;
  const zeroQuantitySelectedCount = Object.values(selectedMaterials)
    .filter(({ quantity }) => !Number(quantity))
    .length;
  const hasCatalogFilter = Boolean(query.trim() || categoryFilter || typeFilter);

  const resetCatalogFilters = () => {
    setQuery("");
    setCategoryFilter("");
    setTypeFilter("");
  };

  const changeCategory = (nextCategory) => {
    setCategoryFilter(nextCategory);
    setTypeFilter("");
  };

  const handleQuantityChange = (itemId, value) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, parseInt(value, 10) || 0),
    }));
  };

  const toggleMaterial = (material) => {
    const key = materialKey(material);
    setSelectedMaterials(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { material, quantity: 0 },
      };
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

  const handleSave = async () => {
    if (saving) return;
    const newItems = Object.values(selectedMaterials).map(({ material, quantity }) =>
      materialToInventoryItem(material, quantity)
    );
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
          style={{ ...segmentStyle, background: tab === "catalog" ? T.white : "transparent", color: tab === "catalog" ? T.grey900 : T.grey500, boxShadow: tab === "catalog" ? "0px 2px 4px rgba(0,0,0,0.06)" : "none" }}
        >
          카탈로그 {selectedCount > 0 ? `${selectedCount}` : ""}
        </button>
        <button
          type="button"
          onClick={() => setTab("existing")}
          style={{ ...segmentStyle, background: tab === "existing" ? T.white : "transparent", color: tab === "existing" ? T.grey900 : T.grey500, boxShadow: tab === "existing" ? "0px 2px 4px rgba(0,0,0,0.06)" : "none" }}
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
              전체 {catalog.length}
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
              {filteredMaterials.total.toLocaleString("ko-KR")}개 결과
              {filteredMaterials.total > filteredMaterials.items.length ? ` · 상위 ${filteredMaterials.items.length}개 표시` : ""}
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
            ) : visibleGroups.length === 0 ? (
              <div style={{ padding: "34px 12px", textAlign: "center", color: T.grey500, fontSize: 14, lineHeight: 1.5 }}>
                조건에 맞는 카탈로그 품목이 없어요
              </div>
            ) : visibleGroups.map(group => (
              <div key={group.key}>
                <div style={{ position: "sticky", top: 0, zIndex: 1, padding: "10px 0 7px", background: T.white, borderBottom: `1px solid ${T.grey100}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.grey700 }}>
                    {group.category} · {group.type} <span style={{ color: T.grey400 }}>{group.items.length}개</span>
                  </p>
                </div>
                {group.items.map((material) => {
                  const key = materialKey(material);
                  const displayName = getMaterialDisplayName(material);
                  const displaySpec = cleanMaterialName(material.spec);
                  const selected = Boolean(selectedMaterials[key]);
                  const exists = existingNames.has(displayName.toLowerCase());
                  const vendorNames = Array.isArray(material.vendor_options)
                    ? [...new Set(material.vendor_options.map(option => option.vendor_name).filter(Boolean))]
                    : [];
                  const typeLabel = getMaterialTypeLabel(material);
                  const categoryLabel = getMaterialCategoryLabel(material);

                  return (
                    <div key={key} style={{ padding: "14px 0", borderBottom: `1px solid ${T.grey100}` }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <button
                          type="button"
                          onClick={() => toggleMaterial(material)}
                          disabled={exists}
                          style={{
                            width: 28,
                            height: 28,
                            marginTop: 2,
                            borderRadius: 9999,
                            border: `1px solid ${selected ? T.blue500 : T.grey300}`,
                            background: selected ? T.blue500 : T.white,
                            color: T.white,
                            cursor: exists ? "not-allowed" : "pointer",
                            opacity: exists ? 0.35 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {selected ? <Check size={17} strokeWidth={3} /> : <Plus size={16} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: T.blue500, background: T.blue50, borderRadius: 9999, padding: "2px 7px" }}>
                              {vendorNames.length ? vendorNames.slice(0, 2).join(" · ") : "카탈로그"}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: T.grey600, background: T.grey100, borderRadius: 9999, padding: "2px 7px" }}>
                              {categoryLabel}
                            </span>
                            {exists && (
                              <span style={{ fontSize: 12, fontWeight: 800, color: T.green500, background: T.green50, borderRadius: 9999, padding: "2px 7px" }}>
                                이미 있음
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.grey900, lineHeight: 1.35 }}>
                            {displayName}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.grey500, lineHeight: 1.45 }}>
                            {[typeLabel, displaySpec, material.unit, material.manufacturer].filter(Boolean).join(" · ")}
                          </p>
                          {selected && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 8, alignItems: "center", marginTop: 10 }}>
                              <p style={{ margin: 0, fontSize: 13, color: T.grey500 }}>초기 수량</p>
                              <Inp
                                type="number"
                                value={selectedMaterials[key].quantity}
                                onChange={(event) => handleMaterialQuantityChange(key, event.target.value)}
                                placeholder="0"
                                style={{ height: 42, textAlign: "right" }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
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
        disabled={saving}
        style={{ width: "100%", padding: "16px 0", borderRadius: 9999, border: "none", background: saving ? T.grey300 : T.blue500, color: T.white, fontSize: 16, fontWeight: 600, cursor: saving ? "default" : "pointer", fontFamily: font, marginBottom: 20 }}
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
