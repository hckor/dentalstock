const toKey = (value) => String(value || "").trim();

const normalizeUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  return "";
};

const findVendorOption = (item, order) => {
  const options = Array.isArray(item?.vendor_options) ? item.vendor_options : [];
  const vendorId = toKey(order?.vendor_id);
  const vendorName = toKey(order?.vendor_name);
  return options.find(option => toKey(option.vendor_id) === vendorId)
    || options.find(option => toKey(option.vendor_name) === vendorName)
    || null;
};

function buildVendorProductLine(order, item) {
  const option = findVendorOption(item, order);
  const productUrl = normalizeUrl(order?.vendor_url || option?.url);

  return {
    orderId: order.id,
    itemId: order.item_id,
    itemName: item?.name || "품목 정보 없음",
    qty: Math.max(1, Number(order.qty) || 1),
    unit: item?.unit || "개",
    vendorId: toKey(order.vendor_id || option?.vendor_id),
    vendorName: order.vendor_name || option?.vendor_name || "거래처 미정",
    sku: order.vendor_sku || option?.sku || "",
    productUrl,
    actionUrl: productUrl,
    missingUrl: !productUrl,
  };
}

export function buildVendorProductLinkGroups(orders = [], items = []) {
  const itemMap = new Map(items.map(item => [item.id, item]));
  const groups = new Map();

  orders
    .filter(order => order?.status === "ordered")
    .forEach(order => {
      const item = itemMap.get(order.item_id);
      const line = buildVendorProductLine(order, item);
      const groupKey = line.vendorId || line.vendorName || "unassigned";
      const existing = groups.get(groupKey) || {
        id: groupKey,
        vendorId: line.vendorId,
        vendorName: line.vendorName,
        lines: [],
      };
      existing.lines.push(line);
      groups.set(groupKey, existing);
    });

  return Array.from(groups.values())
    .map(group => {
      const openableLines = group.lines.filter(line => line.actionUrl);
      return {
        ...group,
        openableCount: openableLines.length,
        missingUrlCount: group.lines.length - openableLines.length,
        urls: openableLines.map(line => line.actionUrl),
      };
    })
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName, "ko"));
}

export function getVendorProductLinkUrls(group) {
  return Array.isArray(group?.urls) ? group.urls.filter(Boolean) : [];
}
