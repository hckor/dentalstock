import { RotateCcw, Search } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { getMaterialDisplayName } from "../../../utils/dentalMaterialCatalog";
import { Inp } from "../../shared/Inp";
import { CatalogGroupRow } from "./CatalogGroupRow";
import { filterChipStyle } from "./initialInventoryModal.styles";

export function CatalogTab({
  query,
  setQuery,
  categoryFilter,
  typeFilter,
  setTypeFilter,
  changeCategory,
  resetCatalogFilters,
  catalogData,
  catalogStatus,
  typeOptions,
  filteredGroups,
  hasCatalogFilter,
  shouldShowCatalogResults,
  temporaryDuplicateMatch,
  addTemporaryMaterial,
  selectedEntryForGroup,
  expandedGroupKey,
  setExpandedGroupKey,
  toggleGroup,
  changeGroupVariant,
  updateGroupSelection,
  handleMaterialQuantityChange,
  getVariantMaterial,
  getDuplicateMatch,
}) {
  const categoryOptions = catalogData.categoryOptions;

  return (
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
        ) : filteredGroups.items.map(group => (
          <CatalogGroupRow
            key={group.key}
            group={group}
            selectedEntry={selectedEntryForGroup(group)}
            expandedGroupKey={expandedGroupKey}
            setExpandedGroupKey={setExpandedGroupKey}
            toggleGroup={toggleGroup}
            changeGroupVariant={changeGroupVariant}
            updateGroupSelection={updateGroupSelection}
            handleMaterialQuantityChange={handleMaterialQuantityChange}
            getVariantMaterial={getVariantMaterial}
            getMaterialDisplayName={getMaterialDisplayName}
            getDuplicateMatch={getDuplicateMatch}
          />
        ))}
      </div>
    </>
  );
}
