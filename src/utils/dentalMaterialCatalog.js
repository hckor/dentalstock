const SOURCE_LABELS = {
  edent: "이덴트",
  seilglobal: "세일글로벌",
  seongsim: "성심덴탈",
};

export function getMaterialSourceLabel(source) {
  return SOURCE_LABELS[source] || source || "거래처";
}

const BRACKETED_MARKETING_PATTERN = /\s*(?:\[[^\]]*(?:특가|전용|런칭|신제품|추천|이벤트|할인)[^\]]*]|\([^)]*(?:특가|전용|런칭|신제품|추천|이벤트|할인)[^)]*\)|【[^】]*(?:특가|전용|런칭|신제품|추천|이벤트|할인)[^】]*】)\s*/gi;
const INLINE_MARKETING_PATTERN = /\s*(?:#?신제품|#?추천|#?특가)\s*/gi;

export function cleanMaterialName(name) {
  const original = String(name || "").trim();
  if (!original) return "";

  const cleaned = original
    .replace(BRACKETED_MARKETING_PATTERN, " ")
    .replace(INLINE_MARKETING_PATTERN, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || original;
}

export function inferMaterialCategoryId(material = {}) {
  const text = `${material.category || ""} ${cleanMaterialName(material.name)}`.toLowerCase();
  if (/리도카인|에피|약|마취|항생|소염|구강유산균/.test(text)) return 2;
  if (/장비|기구|카메라|스케일러|큐링|led|센서|머신/.test(text)) return 4;
  if (/마스크|장갑|거즈|코튼|스왑|파우치|칫솔|소모/.test(text)) return 1;
  return 3;
}

export function inferMaterialUnit(material = {}) {
  const text = `${material.package_unit || ""} ${material.spec || ""}`.toLowerCase();
  if (/box|박스/.test(text)) return "박스";
  if (/set|세트/.test(text)) return "세트";
  if (/pkg|package|갑|팩/.test(text)) return "팩";
  if (/병/.test(text)) return "병";
  if (/롤/.test(text)) return "롤";
  if (/대/.test(text)) return "대";
  return "개";
}

export function materialToInventoryItem(material, quantity = 0) {
  const sourceLabel = getMaterialSourceLabel(material.source);
  const name = cleanMaterialName(material.name);
  const price = Number(material.sale_price_krw ?? material.list_price_krw);
  const vendorOption = Number.isFinite(price) && price > 0
    ? [{
        vendor_id: material.source,
        vendor_name: sourceLabel,
        price,
        sku: material.product_code || material.source_product_id || "",
        url: material.detail_url || "",
        last_checked_at: new Date().toISOString(),
      }]
    : [];

  return {
    id: `catalog-${material.source}-${material.source_product_id || material.product_code || Date.now()}`,
    name,
    category_id: inferMaterialCategoryId(material),
    unit: inferMaterialUnit(material),
    current_qty: Math.max(0, Number(quantity) || 0),
    min_qty: 1,
    location: "",
    expiry: null,
    vendor_options: vendorOption,
    catalog_source: material.source,
    catalog_source_product_id: material.source_product_id,
    product_code: material.product_code || "",
    material_spec: material.spec || "",
    manufacturer: material.manufacturer || "",
  };
}

export function searchMaterials(materials, query, limit = 30) {
  const normalized = String(query || "").trim().toLowerCase();
  const candidates = normalized
    ? materials.filter((material) => {
        const haystack = [
          cleanMaterialName(material.name),
          material.name,
          material.product_code,
          material.spec,
          material.category,
          material.manufacturer,
          getMaterialSourceLabel(material.source),
        ].join(" ").toLowerCase();
        return haystack.includes(normalized);
      })
    : materials;

  return candidates.slice(0, limit);
}
