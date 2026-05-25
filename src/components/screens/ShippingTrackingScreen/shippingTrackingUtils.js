import { getShippingEvents } from "../../../utils/shippingEvents";
import { getOrderVendorKey } from "../../../utils/vendorSelection";

const CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배"];

function hashOrderId(orderId) {
  return String(orderId).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function makeDemoTracking(orderId) {
  const hash = hashOrderId(orderId);
  return {
    carrier: CARRIERS[hash % CARRIERS.length],
    trackingNumber: String(1000000000 + (hash * 2654435761) % 9000000000),
  };
}

export function groupInTransitOrders(orders) {
  const groups = new Map();
  orders.forEach(order => {
    const key = order.shipment_group_id ||
      (order.review_note === "일괄 승인" && order.reviewed_at ? `bulk:${order.reviewed_at}:${order.reviewed_by || ""}:${getOrderVendorKey(order)}` : order.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(order);
  });
  return Array.from(groups.entries()).map(([id, groupOrders]) => ({ id, orders: groupOrders }));
}

function getReceivedAt(order) {
  return order.received_at ||
    getShippingEvents(order).find(event => event.status === "입고완료")?.timestamp ||
    order.reviewed_at ||
    order.requested_at ||
    "";
}

function getCompletedDateKey(order) {
  const receivedAt = getReceivedAt(order);
  const parsed = new Date(receivedAt);
  if (!receivedAt || Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.toISOString().slice(0, 10);
}

function formatCompletedDateLabel(dateKey) {
  if (dateKey === "unknown") return "날짜 미상";
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "날짜 미상";
  return parsed.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function getCompletedDeliveryKey(order) {
  if (order.shipment_group_id) return `shipment:${order.shipment_group_id}`;
  if (order.tracking_number) return `tracking:${order.carrier || ""}:${order.tracking_number}`;
  if (order.review_note === "일괄 승인" && order.reviewed_at) {
    return `bulk:${order.reviewed_at}:${order.reviewed_by || ""}:${getOrderVendorKey(order)}`;
  }
  return `single:${order.id}`;
}

export function groupCompletedOrdersByDate(orders) {
  const dateGroups = new Map();
  orders.forEach(order => {
    const dateKey = getCompletedDateKey(order);
    const deliveryKey = getCompletedDeliveryKey(order);
    if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, new Map());
    const deliveries = dateGroups.get(dateKey);
    if (!deliveries.has(deliveryKey)) deliveries.set(deliveryKey, []);
    deliveries.get(deliveryKey).push(order);
  });

  return Array.from(dateGroups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, deliveries]) => ({
      dateKey,
      label: formatCompletedDateLabel(dateKey),
      orderCount: Array.from(deliveries.values()).reduce((sum, groupOrders) => sum + groupOrders.length, 0),
      groups: Array.from(deliveries.entries())
        .map(([id, groupOrders]) => ({
          id,
          orders: groupOrders.sort((a, b) => getReceivedAt(b).localeCompare(getReceivedAt(a))),
          receivedAt: groupOrders.map(getReceivedAt).sort().at(-1) || "",
        }))
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    }));
}
