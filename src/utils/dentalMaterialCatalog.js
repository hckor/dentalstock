const SOURCE_LABELS = {
  edent: "이덴트",
  seilglobal: "세일글로벌",
  seongsim: "성심덴탈",
  dental365: "덴탈365",
  jdent: "제이덴트",
};

export function getMaterialSourceLabel(source) {
  return SOURCE_LABELS[source] || source || "거래처";
}

const CATEGORY_IDS = {
  consumable: 1,
  medicine: 2,
  material: 3,
  equipment: 4,
};
const CATEGORY_LABEL_ORDER = ["소모품", "의약품", "재료", "임플란트", "장비/기구"];

const MARKETING_WORDS = "특가|체험특가|전용|런칭|신제품|추천|이벤트|할인|선주문|증정|무료|반품불가|반품\\s*불가|포인트\\s*적립|유통기한\\s*임박|임박|미만\\s*주문|주문|절약형|행사";
const BRACKETED_MARKETING_PATTERN = new RegExp(
  `\\s*(?:\\[[^\\]]*(?:${MARKETING_WORDS})[^\\]]*]|\\([^)]*(?:${MARKETING_WORDS})[^)]*\\)|【[^】]*(?:${MARKETING_WORDS})[^】]*】)\\s*`,
  "gi"
);
const INLINE_MARKETING_PATTERN = new RegExp(
  `\\s*(?:#?신제품|#?추천|#?특가|체험특가|런칭|이벤트|할인\\s*이벤트|추천상품|신상품)\\s*`,
  "gi"
);
const GIVEAWAY_PATTERN = /\s*(?:구매\s*시|구매시).*(?:증정|이벤트).*/gi;
const POLICY_PATTERN = /\s*\/?\s*(?:반품\s*불가\s*상품?|참고용\s*대표이미지|묶음상품\s*구매\s*시\s*할인\s*적용)\s*/gi;

export function cleanMaterialName(name) {
  const original = String(name || "").trim();
  if (!original) return "";

  const cleaned = original
    .replace(BRACKETED_MARKETING_PATTERN, " ")
    .replace(GIVEAWAY_PATTERN, " ")
    .replace(POLICY_PATTERN, " ")
    .replace(INLINE_MARKETING_PATTERN, " ")
    .replace(/\s*전용\s*/gi, " ")
    .replace(/\s*[-/]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || original;
}

export function getMaterialDisplayName(material = {}) {
  return cleanMaterialName(material.display_name || material.name);
}

export function getMaterialCategoryLabel(material = {}) {
  return material.category || inferMaterialCategoryName(material);
}

export function getMaterialTypeLabel(material = {}) {
  const rawType = material.source_category || material.type || material.normalized_type || "";
  const lastMeaningfulPart = String(rawType)
    .split(">")
    .map(part => part.trim())
    .filter(Boolean)
    .pop();
  const type = cleanMaterialName(lastMeaningfulPart || rawType);
  return type || "기타";
}

export function inferMaterialCategoryName(material = {}) {
  if (material.normalized_category) return material.normalized_category;
  const text = [
    material.category,
    material.spec,
    material.package_unit,
    getMaterialDisplayName(material),
  ].join(" ").toLowerCase();

  if (/리도카인|lidocaine|에피|epi|약품|마취|항생|소염|구강유산균|소독제|시약|지혈|불소|바니쉬/.test(text)) {
    return "의약품";
  }
  if (/픽스처|fixture|어버트먼트|abutment|스크류|screw|임플란트|implant|멤브레인|membrane|골이식|bone graft/.test(text)) {
    return "임플란트";
  }
  if (/장비|기구|카메라|스케일러|스켈러|큐링|curing|led|센서|sensor|머신|machine|모터|motor|건\s|gun|집진기|루페|오토클레이브|핸드피스/.test(text)) {
    return "장비/기구";
  }
  if (/마스크|mask|장갑|글러브|glove|거즈|gauze|코튼|cotton|스왑|swab|파우치|pouch|칫솔|toothbrush|석션|suction|needle|니들|시린지|syringe|브러쉬|brush|팁|tip|일회용|위생|소모/.test(text)) {
    return "소모품";
  }
  return "재료";
}

export function inferMaterialCategoryId(material = {}) {
  if (Number.isFinite(Number(material.category_id))) return Number(material.category_id);
  const category = inferMaterialCategoryName(material);
  if (category === "소모품") return CATEGORY_IDS.consumable;
  if (category === "의약품") return CATEGORY_IDS.medicine;
  if (category === "장비/기구") return CATEGORY_IDS.equipment;
  return CATEGORY_IDS.material;
}

export function inferMaterialUnit(material = {}) {
  if (material.unit) return material.unit;
  const text = `${material.package_unit || ""} ${material.spec || ""} ${material.name || ""}`.toLowerCase();
  if (/box|박스/.test(text)) return "박스";
  if (/set|세트/.test(text)) return "세트";
  if (/cart|카트리지/.test(text)) return "카트리지";
  if (/capsule|캡슐|켑슐/.test(text)) return "캡슐";
  if (/syringe|시린지/.test(text)) return "시린지";
  if (/ampoule|앰플/.test(text)) return "앰플";
  if (/pkg|package|pack|갑|팩|pcs|st\.|파우치/.test(text)) return "팩";
  if (/병|bottle/.test(text)) return "병";
  if (/롤|roll/.test(text)) return "롤";
  if (/대/.test(text)) return "대";
  if (/봉/.test(text)) return "봉";
  return "개";
}

export function inferMinimumOrderUnit(material = {}) {
  if (Number.isFinite(Number(material.min_order_qty)) && Number(material.min_order_qty) > 0) {
    return Number(material.min_order_qty);
  }
  const text = `${material.name || ""} ${material.package_unit || ""} ${material.spec || ""}`;
  const matched = text.match(/(\d+)\s*(?:박스|box|갑|팩|개|pcs|ea)\b/i);
  return matched ? Math.max(1, Number(matched[1])) : 1;
}

export function inferExpiryManaged(material = {}) {
  if (typeof material.expiry_managed === "boolean") return material.expiry_managed;
  const text = `${inferMaterialCategoryName(material)} ${material.category || ""} ${material.name || ""} ${material.spec || ""}`.toLowerCase();
  return /의약품|약품|리도카인|lidocaine|에피|epi|마취|항생|소염|소독제|시약|지혈|레진|resin|본딩|bond|시멘트|cement|실러|sealer|인상재|alginate|실리콘|멸균|sterile|유효기간|바이오실러/.test(text);
}

function normalizeVendorOption(option = {}, fallback = {}) {
  const source = option.vendor_id || option.source || fallback.source || "";
  const price = Number(option.price ?? option.sale_price_krw ?? option.list_price_krw ?? fallback.sale_price_krw ?? fallback.list_price_krw);

  return {
    vendor_id: source,
    vendor_name: option.vendor_name || getMaterialSourceLabel(source),
    product_code: option.product_code || option.sku || fallback.product_code || fallback.source_product_id || "",
    sku: option.sku || option.product_code || fallback.product_code || fallback.source_product_id || "",
    price: Number.isFinite(price) && price > 0 ? price : null,
    list_price_krw: option.list_price_krw ?? fallback.list_price_krw ?? null,
    sale_price_krw: option.sale_price_krw ?? option.price ?? fallback.sale_price_krw ?? null,
    url: option.url || option.detail_url || fallback.detail_url || "",
    source_product_id: option.source_product_id || fallback.source_product_id || "",
    last_checked_at: option.last_checked_at || fallback.scraped_at || null,
  };
}

export function getMaterialVendorOptions(material = {}) {
  if (Array.isArray(material.vendor_options)) {
    return material.vendor_options.map(option => normalizeVendorOption(option, material));
  }

  const option = normalizeVendorOption({}, material);
  return option.price || option.product_code || option.url ? [option] : [];
}

function countOptions(materials, getValue) {
  const counts = materials.reduce((acc, material) => {
    const value = getValue(material);
    if (!value) return acc;
    acc.set(value, (acc.get(value) || 0) + 1);
    return acc;
  }, new Map());

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko-KR"));
}

function getCategorySortIndex(category) {
  const index = CATEGORY_LABEL_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_LABEL_ORDER.length : index;
}

export function getMaterialCategoryOptions(materials = []) {
  return countOptions(materials, getMaterialCategoryLabel)
    .sort((a, b) => getCategorySortIndex(a.value) - getCategorySortIndex(b.value) || b.count - a.count || a.label.localeCompare(b.label, "ko-KR"));
}

export function getMaterialTypeOptions(materials = [], category = "") {
  const scoped = category
    ? materials.filter(material => getMaterialCategoryLabel(material) === category)
    : materials;
  return countOptions(scoped, getMaterialTypeLabel);
}

function matchesMaterialQuery(material, normalizedQuery) {
  if (!normalizedQuery) return true;
  const vendorText = getMaterialVendorOptions(material)
    .map(option => [option.vendor_name, option.product_code, option.sku, option.source_product_id, option.url].join(" "))
    .join(" ");
  const haystack = [
    getMaterialDisplayName(material),
    material.name,
    material.product_code,
    material.spec,
    material.category,
    material.normalized_category,
    getMaterialTypeLabel(material),
    material.source_category,
    material.unit,
    material.manufacturer,
    material.search_keywords,
    getMaterialSourceLabel(material.source),
    vendorText,
  ].join(" ").toLowerCase();
  return haystack.includes(normalizedQuery);
}

export function filterMaterials(materials = [], { query = "", category = "", type = "" } = {}, limit = 80) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const filtered = materials.filter(material => (
    (!category || getMaterialCategoryLabel(material) === category) &&
    (!type || getMaterialTypeLabel(material) === type) &&
    matchesMaterialQuery(material, normalizedQuery)
  )).sort((a, b) => (
    getCategorySortIndex(getMaterialCategoryLabel(a)) - getCategorySortIndex(getMaterialCategoryLabel(b)) ||
    getMaterialTypeLabel(a).localeCompare(getMaterialTypeLabel(b), "ko-KR") ||
    getMaterialDisplayName(a).localeCompare(getMaterialDisplayName(b), "ko-KR")
  ));

  return {
    total: filtered.length,
    items: filtered.slice(0, limit),
  };
}

export function groupMaterialsByCategoryAndType(materials = []) {
  const groups = [];
  const groupMap = new Map();

  materials.forEach(material => {
    const category = getMaterialCategoryLabel(material);
    const type = getMaterialTypeLabel(material);
    const key = `${category}::${type}`;
    if (!groupMap.has(key)) {
      const group = { key, category, type, items: [] };
      groupMap.set(key, group);
      groups.push(group);
    }
    groupMap.get(key).items.push(material);
  });

  return groups;
}

export function materialToInventoryItem(material, quantity = 0) {
  const vendorOptions = getMaterialVendorOptions(material);
  const primaryVendor = vendorOptions[0] || {};
  const catalogId = material.catalog_id || `${material.source || primaryVendor.vendor_id}-${material.source_product_id || primaryVendor.source_product_id || material.product_code || primaryVendor.product_code || Date.now()}`;

  return {
    id: `catalog-${catalogId}`,
    name: getMaterialDisplayName(material),
    category_id: inferMaterialCategoryId(material),
    unit: inferMaterialUnit(material),
    current_qty: Math.max(0, Number(quantity) || 0),
    min_qty: inferMinimumOrderUnit(material),
    location: "",
    expiry: null,
    vendor_options: vendorOptions,
    catalog_id: catalogId,
    catalog_source: material.source || primaryVendor.vendor_id || "",
    catalog_source_product_id: material.source_product_id || primaryVendor.source_product_id || "",
    product_code: material.product_code || primaryVendor.product_code || "",
    material_spec: material.spec || "",
    manufacturer: material.manufacturer || "",
    expiry_managed: inferExpiryManaged(material),
  };
}

export function searchMaterials(materials, query, limit = 30) {
  const normalized = String(query || "").trim().toLowerCase();
  const candidates = normalized
    ? materials.filter((material) => matchesMaterialQuery(material, normalized))
    : materials;

  return candidates.slice(0, limit);
}
