import { useEffect, useMemo, useState } from "react";
import {
  filterPreparedMaterialCatalogGroups,
  loadPreparedDentalMaterialCatalog,
  materialToInventoryItem,
} from "../../../utils/dentalMaterialCatalog";
import { findSimilarInventoryItem } from "../../../utils/itemIdentity";
import { CatalogTab } from "./CatalogTab";
import { ExistingItemsTab } from "./ExistingItemsTab";
import {
  InitialInventoryModalHeader,
  InitialInventoryModalTabs,
  InitialInventorySaveButton,
  InitialInventorySelectionSummary,
} from "./InitialInventoryModalChrome";

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

    loadPreparedDentalMaterialCatalog()
      .then((preparedCatalog) => {
        if (!mounted) return;
        setCatalogData(preparedCatalog);
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
      <InitialInventoryModalHeader onClose={onClose} />
      <InitialInventoryModalTabs tab={tab} setTab={setTab} selectedCount={selectedCount} />

      {tab === "catalog" && (
        <CatalogTab
          query={query}
          setQuery={setQuery}
          categoryFilter={categoryFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          changeCategory={changeCategory}
          resetCatalogFilters={resetCatalogFilters}
          catalogData={catalogData}
          catalogStatus={catalogStatus}
          typeOptions={typeOptions}
          filteredGroups={filteredGroups}
          hasCatalogFilter={hasCatalogFilter}
          shouldShowCatalogResults={shouldShowCatalogResults}
          temporaryDuplicateMatch={temporaryDuplicateMatch}
          addTemporaryMaterial={addTemporaryMaterial}
          selectedEntryForGroup={selectedEntryForGroup}
          expandedGroupKey={expandedGroupKey}
          setExpandedGroupKey={setExpandedGroupKey}
          toggleGroup={toggleGroup}
          changeGroupVariant={changeGroupVariant}
          updateGroupSelection={updateGroupSelection}
          handleMaterialQuantityChange={handleMaterialQuantityChange}
          getVariantMaterial={getVariantMaterial}
          getDuplicateMatch={getDuplicateMatch}
        />
      )}

      {tab === "existing" && (
        <ExistingItemsTab
          items={items}
          quantities={quantities}
          handleQuantityChange={handleQuantityChange}
        />
      )}

      {tab === "catalog" && (
        <InitialInventorySelectionSummary
          selectedCount={selectedCount}
          zeroQuantitySelectedCount={zeroQuantitySelectedCount}
        />
      )}

      <InitialInventorySaveButton
        tab={tab}
        saving={saving}
        selectedCount={selectedCount}
        onSave={handleSave}
      />
    </div>
  );
}
