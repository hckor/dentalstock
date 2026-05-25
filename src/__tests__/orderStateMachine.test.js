import { describe, expect, it } from "vitest";
import { ORDER_STATUS } from "../constants/orderStates";
import {
  ORDER_INITIAL_STATUS,
  ORDER_STATUS_VALUES,
  ORDER_TRANSITIONS,
  assertOrderTransitionAllowed,
  canRoleTransitionOrderStatus,
  getAllowedOrderTransitions,
  getOrderTransitionPermissions,
  isKnownOrderStatus,
  isOrderActive,
  isOrderReceivable,
  isOrderReviewable,
  isOrderTerminal,
  isOrderTransitionAllowed,
} from "../utils/orderStateMachine";

describe("order state machine", () => {
  it("uses the persisted order status names without adding UI-breaking aliases", () => {
    expect(ORDER_INITIAL_STATUS).toBe("pending");
    expect(ORDER_STATUS_VALUES).toEqual([
      "pending",
      "hold",
      "ordered",
      "received",
      "rejected",
    ]);
    expect(Object.keys(ORDER_TRANSITIONS)).toEqual(ORDER_STATUS_VALUES);
    expect(isKnownOrderStatus("requested")).toBe(false);
    expect(isKnownOrderStatus("approved")).toBe(false);
  });

  it("allows current valid transitions", () => {
    expect(isOrderTransitionAllowed(ORDER_STATUS.pending, ORDER_STATUS.hold)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.pending, ORDER_STATUS.ordered)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.pending, ORDER_STATUS.rejected)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.hold, ORDER_STATUS.ordered)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.hold, ORDER_STATUS.rejected)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.ordered, ORDER_STATUS.received)).toBe(true);
    expect(assertOrderTransitionAllowed(ORDER_STATUS.pending, ORDER_STATUS.ordered)).toBe(true);
  });

  it("rejects invalid transitions and unknown statuses", () => {
    expect(isOrderTransitionAllowed(ORDER_STATUS.pending, ORDER_STATUS.received)).toBe(false);
    expect(isOrderTransitionAllowed(ORDER_STATUS.ordered, ORDER_STATUS.pending)).toBe(false);
    expect(isOrderTransitionAllowed(ORDER_STATUS.received, ORDER_STATUS.ordered)).toBe(false);
    expect(isOrderTransitionAllowed(ORDER_STATUS.rejected, ORDER_STATUS.ordered)).toBe(false);
    expect(isOrderTransitionAllowed("requested", ORDER_STATUS.pending)).toBe(false);
    expect(isOrderTransitionAllowed(ORDER_STATUS.pending, "approved")).toBe(false);
    expect(() => assertOrderTransitionAllowed(ORDER_STATUS.received, ORDER_STATUS.ordered)).toThrow(
      "Invalid order status transition: received -> ordered"
    );
  });

  it("keeps final states idempotent without allowing outgoing changes", () => {
    expect(isOrderTransitionAllowed(ORDER_STATUS.received, ORDER_STATUS.received)).toBe(true);
    expect(isOrderTransitionAllowed(ORDER_STATUS.rejected, ORDER_STATUS.rejected)).toBe(true);
    expect(getAllowedOrderTransitions(ORDER_STATUS.received)).toEqual([]);
    expect(getAllowedOrderTransitions(ORDER_STATUS.rejected)).toEqual([]);
    expect(isOrderTerminal(ORDER_STATUS.received)).toBe(true);
    expect(isOrderTerminal(ORDER_STATUS.rejected)).toBe(true);
  });

  it("classifies review, fulfillment, and active states", () => {
    expect(isOrderReviewable(ORDER_STATUS.pending)).toBe(true);
    expect(isOrderReviewable(ORDER_STATUS.hold)).toBe(true);
    expect(isOrderReviewable(ORDER_STATUS.ordered)).toBe(false);
    expect(isOrderReceivable(ORDER_STATUS.ordered)).toBe(true);
    expect(isOrderReceivable(ORDER_STATUS.pending)).toBe(false);
    expect(isOrderActive(ORDER_STATUS.pending)).toBe(true);
    expect(isOrderActive(ORDER_STATUS.hold)).toBe(true);
    expect(isOrderActive(ORDER_STATUS.ordered)).toBe(true);
    expect(isOrderActive(ORDER_STATUS.received)).toBe(false);
  });

  it("applies manager and owner approval boundaries when an owner gate is present", () => {
    expect(canRoleTransitionOrderStatus("manager", ORDER_STATUS.pending, ORDER_STATUS.ordered)).toBe(true);
    expect(canRoleTransitionOrderStatus("manager", ORDER_STATUS.pending, ORDER_STATUS.ordered, {
      requiresOwnerApproval: true,
    })).toBe(false);
    expect(canRoleTransitionOrderStatus("owner", ORDER_STATUS.pending, ORDER_STATUS.ordered, {
      requiresOwnerApproval: true,
    })).toBe(true);
    expect(canRoleTransitionOrderStatus("hygienist", ORDER_STATUS.pending, ORDER_STATUS.ordered)).toBe(false);
    expect(canRoleTransitionOrderStatus("manager", ORDER_STATUS.pending, ORDER_STATUS.hold)).toBe(true);
    expect(getOrderTransitionPermissions(ORDER_STATUS.pending, ORDER_STATUS.ordered, {
      requiresOwnerApproval: true,
    })).toEqual(["orders_approve_standard", "orders_approve_owner_review"]);
  });
});
