import { fmtFull } from "./helpers";

const hasEvents = (events) => Array.isArray(events) && events.length > 0;

const formatTimestamp = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return fmtFull(value);
};

export const getShippingEventTimeLabel = (event) =>
  formatTimestamp(event.timestamp) || event.label || "시간 정보 없음";

const normalizeEvent = (event, order) => ({
  status: event.status || "배송 업데이트",
  timestamp: event.timestamp || "",
  label: event.label,
  location: event.location || order?.carrier || "위치 확인 중",
  completed: event.completed !== false,
});

const getStoredShippingEvents = (order) => {
  if (hasEvents(order?.shipping_events)) return order.shipping_events;
  if (hasEvents(order?.shipping_timeline)) return order.shipping_timeline;
  return [];
};

export const buildInitialShippingEvents = ({ order, carrier, timestamp }) => [
  {
    status: "배송중",
    timestamp,
    label: "송장 등록됨",
    location: carrier || "배송사",
    completed: true,
  },
  {
    status: "주문접수",
    timestamp: order?.reviewed_at || order?.requested_at || timestamp,
    label: "도매 주문 접수",
    location: "도매 사이트",
    completed: true,
  },
];

export const addReceiptShippingEvent = (order, timestamp) => [
  {
    status: "입고완료",
    timestamp,
    label: "입고 확인됨",
    location: "치과 재고실",
    completed: true,
  },
  ...getStoredShippingEvents(order),
];

export const addPartialReceiptShippingEvent = (order, timestamp, receivedQty, totalQty) => [
  {
    status: "부분입고",
    timestamp,
    label: `${receivedQty}/${totalQty} 입고 확인됨`,
    location: "치과 재고실",
    completed: true,
  },
  ...getStoredShippingEvents(order),
];

export const hasShippingEventStatus = (order, status) =>
  getStoredShippingEvents(order).some(event => event.status === status);

export function getNextShippingProgressEvent(order, timestamp = new Date().toISOString()) {
  if (!order?.tracking_number) return null;
  if (!hasShippingEventStatus(order, "배송출발")) {
    return {
      status: "배송출발",
      timestamp,
      label: "배송사가 상품을 인수했습니다",
      location: order.carrier || "배송사",
      completed: true,
    };
  }
  if (!hasShippingEventStatus(order, "배달완료")) {
    return {
      status: "배달완료",
      timestamp,
      label: "치과에 도착했습니다",
      location: "치과 접수대",
      completed: true,
    };
  }
  return null;
}

export const addShippingProgressEvent = (order, event) => [
  event,
  ...getStoredShippingEvents(order),
];

const buildFallbackShippingEvents = (order) => {
  const carrier = order?.carrier || "배송사";
  const approvedAt = order?.reviewed_at || order?.requested_at;
  const hasTracking = Boolean(order?.tracking_number);

  if (order?.status === "received") {
    return [
      { status: "입고완료", label: "입고 확인됨", location: "치과 재고실", completed: true },
      ...(hasTracking ? [{ status: "배송중", label: "배송 진행", location: carrier, completed: true }] : []),
      { status: "주문접수", timestamp: approvedAt, label: approvedAt ? undefined : "도매 주문 접수", location: "도매 사이트", completed: true },
    ];
  }

  if (order?.status === "ordered" && Number(order?.received_qty) > 0) {
    return [
      { status: "부분입고", label: `${order.received_qty}/${order.qty} 입고 확인됨`, location: "치과 재고실", completed: true },
      ...(hasTracking ? [{ status: "배송중", label: "배송 진행", location: carrier, completed: true }] : []),
      { status: "주문접수", timestamp: approvedAt, label: approvedAt ? undefined : "도매 주문 접수", location: "도매 사이트", completed: true },
    ];
  }

  if (order?.status === "ordered" && hasTracking) {
    return [
      { status: "배송중", label: "배송 진행", location: carrier, completed: true },
      { status: "주문접수", timestamp: approvedAt, label: approvedAt ? undefined : "도매 주문 접수", location: "도매 사이트", completed: true },
    ];
  }

  if (order?.status === "ordered") {
    return [
      { status: "배송대기", label: "송장 등록 대기", location: carrier, completed: false },
      { status: "주문접수", timestamp: approvedAt, label: approvedAt ? undefined : "도매 주문 접수", location: "도매 사이트", completed: true },
    ];
  }

  return [
    { status: "발주요청", timestamp: order?.requested_at, label: order?.requested_at ? undefined : "요청 접수", location: "치과", completed: order?.status !== "rejected" },
  ];
};

export const getShippingEvents = (order) => {
  const events = getStoredShippingEvents(order);
  const source = hasEvents(events) ? events : buildFallbackShippingEvents(order);
  return source.map((event) => normalizeEvent(event, order));
};
