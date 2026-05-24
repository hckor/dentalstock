import { can } from "../constants/permissions";
import { ORDER_STATUS } from "../constants/orderStates";

export const ORDER_INITIAL_STATUS = ORDER_STATUS.pending;
export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

export const ORDER_TERMINAL_STATUSES = Object.freeze([
  ORDER_STATUS.received,
  ORDER_STATUS.rejected,
]);

export const ORDER_REVIEWABLE_STATUSES = Object.freeze([
  ORDER_STATUS.pending,
  ORDER_STATUS.hold,
]);

export const ORDER_FULFILLMENT_STATUSES = Object.freeze([
  ORDER_STATUS.ordered,
]);

export const ORDER_ACTIVE_STATUSES = Object.freeze([
  ORDER_STATUS.pending,
  ORDER_STATUS.hold,
  ORDER_STATUS.ordered,
]);

const transitionEntries = [
  [ORDER_STATUS.pending, [
    ORDER_STATUS.hold,
    ORDER_STATUS.ordered,
    ORDER_STATUS.rejected,
  ]],
  [ORDER_STATUS.hold, [
    ORDER_STATUS.ordered,
    ORDER_STATUS.rejected,
  ]],
  [ORDER_STATUS.ordered, [
    ORDER_STATUS.received,
  ]],
  [ORDER_STATUS.received, []],
  [ORDER_STATUS.rejected, []],
];

export const ORDER_TRANSITIONS = Object.freeze(Object.fromEntries(
  transitionEntries.map(([status, transitions]) => [status, Object.freeze(transitions)])
));

const transitionPermissionEntries = [
  [ORDER_STATUS.pending, {
    [ORDER_STATUS.hold]: ["orders_hold"],
    [ORDER_STATUS.ordered]: ["orders_approve_standard"],
    [ORDER_STATUS.rejected]: ["orders_reject"],
  }],
  [ORDER_STATUS.hold, {
    [ORDER_STATUS.ordered]: ["orders_approve_standard"],
    [ORDER_STATUS.rejected]: ["orders_reject"],
  }],
  [ORDER_STATUS.ordered, {
    [ORDER_STATUS.received]: ["orders_approve"],
  }],
];

export const ORDER_TRANSITION_PERMISSIONS = Object.freeze(Object.fromEntries(
  transitionPermissionEntries.map(([status, permissionsByTarget]) => [
    status,
    Object.freeze(Object.fromEntries(
      Object.entries(permissionsByTarget).map(([target, permissions]) => [target, Object.freeze(permissions)])
    )),
  ])
));

export function normalizeOrderStatus(status) {
  return ORDER_STATUS_VALUES.includes(status) ? status : null;
}

export function isKnownOrderStatus(status) {
  return normalizeOrderStatus(status) !== null;
}

export function isOrderStatus(status, expectedStatus) {
  return normalizeOrderStatus(status) === expectedStatus;
}

export function getAllowedOrderTransitions(status, { includeSelf = false } = {}) {
  const normalizedStatus = normalizeOrderStatus(status);
  if (!normalizedStatus) return [];

  const transitions = ORDER_TRANSITIONS[normalizedStatus] || [];
  return includeSelf ? Object.freeze([normalizedStatus, ...transitions]) : transitions;
}

export function isOrderTransitionAllowed(fromStatus, toStatus, { allowNoop = true } = {}) {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  if (!from || !to) return false;
  if (allowNoop && from === to) return true;
  return getAllowedOrderTransitions(from).includes(to);
}

export function assertOrderTransitionAllowed(fromStatus, toStatus, options) {
  if (isOrderTransitionAllowed(fromStatus, toStatus, options)) return true;
  throw new Error(`Invalid order status transition: ${String(fromStatus)} -> ${String(toStatus)}`);
}

export function isOrderReviewable(status) {
  return ORDER_REVIEWABLE_STATUSES.includes(status);
}

export function isOrderReceivable(status) {
  return isOrderTransitionAllowed(status, ORDER_STATUS.received, { allowNoop: false });
}

export function isOrderActive(status) {
  return ORDER_ACTIVE_STATUSES.includes(status);
}

export function isOrderTerminal(status) {
  return ORDER_TERMINAL_STATUSES.includes(status);
}

export function getOrderTransitionPermissions(fromStatus, toStatus, { requiresOwnerApproval = false } = {}) {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  if (!from || !to) return [];
  if (from === to) return [];
  if (!isOrderTransitionAllowed(from, to, { allowNoop: false })) return [];

  const permissions = [...(ORDER_TRANSITION_PERMISSIONS[from]?.[to] || [])];
  if (to === ORDER_STATUS.ordered && requiresOwnerApproval && !permissions.includes("orders_approve_owner_review")) {
    permissions.push("orders_approve_owner_review");
  }
  return permissions;
}

export function canRoleTransitionOrderStatus(
  role,
  fromStatus,
  toStatus,
  { requiresOwnerApproval = false, canFn = can } = {}
) {
  if (!isOrderTransitionAllowed(fromStatus, toStatus)) return false;
  const permissions = getOrderTransitionPermissions(fromStatus, toStatus, { requiresOwnerApproval });
  return permissions.every(permission => canFn(role, permission));
}
