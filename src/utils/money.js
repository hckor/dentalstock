export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatMoney(value) {
  return `${Math.round(toNumber(value)).toLocaleString("ko-KR")}원`;
}

export function compactMoney(value) {
  const amount = Math.round(toNumber(value));
  if (Math.abs(amount) >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function itemUnitPrice(item) {
  const prices = [
    item?.price,
    ...(Array.isArray(item?.vendor_options) ? item.vendor_options.map(option => option.price) : []),
  ].map(toNumber).filter(price => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export function orderUnitPrice(order, item) {
  return toNumber(order?.vendor_price) || itemUnitPrice(item);
}

export function orderAmount(order, item) {
  return orderUnitPrice(order, item) * toNumber(order?.qty);
}

export function highestVendorPrice(item) {
  const prices = Array.isArray(item?.vendor_options)
    ? item.vendor_options.map(option => toNumber(option.price)).filter(price => price > 0)
    : [];

  return prices.length ? Math.max(...prices) : 0;
}
