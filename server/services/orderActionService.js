const ORDER_ACTION_ROLES = new Set(["owner", "manager"]);
const ORDER_ACTIONS = new Set(["approve", "reject", "tracking", "receive"]);
const ORDER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

function requestError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertOrderActionAllowed(context) {
  if (!ORDER_ACTION_ROLES.has(context?.role)) {
    throw requestError(403, "order_action_forbidden");
  }
}

function assertOrderId(orderId) {
  if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId)) {
    throw requestError(400, "invalid_order_id");
  }
}

function readOptionalText(value, { field, max = 300 } = {}) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw requestError(400, `${field}_invalid`);
  }

  const text = value.trim();
  if (text.length > max) {
    throw requestError(400, `${field}_too_long`);
  }
  return text;
}

function readRequiredText(value, { field, min = 1, max = 80 } = {}) {
  const text = readOptionalText(value, { field, max });
  if (text.length < min) {
    throw requestError(400, `${field}_required`);
  }
  return text;
}

function readOptionalQuantity(value) {
  if (value === undefined || value === null || value === "") return null;
  if (!Number.isInteger(value) || value < 1 || value > 100_000) {
    throw requestError(400, "actual_qty_invalid");
  }
  return value;
}

function readOptionalInteger(value, { field, min = 1, max = 100_000_000 } = {}) {
  if (value === undefined || value === null || value === "") return null;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw requestError(400, `${field}_invalid`);
  }
  return value;
}

function trackingLast4(trackingNumber) {
  return trackingNumber.slice(-4);
}

export function runOrderAction({ action, orderId, body = {}, context, now = () => new Date().toISOString() }) {
  if (!ORDER_ACTIONS.has(action)) {
    throw requestError(404, "order_action_not_found");
  }

  assertOrderId(orderId);
  assertOrderActionAllowed(context);

  const base = {
    queued: true,
    action,
    orderId,
    clinicId: context.clinicId,
    requestedBy: context.userId,
    requestedRole: context.role,
    acceptedAt: now(),
  };

  if (action === "approve") {
    return {
      ...base,
      auditAction: "order.approved",
      reviewNote: readOptionalText(body.reviewNote, { field: "review_note" }),
    };
  }

  if (action === "reject") {
    return {
      ...base,
      auditAction: "order.rejected",
      reviewNote: readOptionalText(body.reviewNote, { field: "review_note" }),
    };
  }

  if (action === "tracking") {
    const carrier = readRequiredText(body.carrier, { field: "carrier", max: 40 });
    const trackingNumber = readRequiredText(body.trackingNumber, { field: "tracking_number", min: 4, max: 80 });
    return {
      ...base,
      auditAction: "order.tracking_registered",
      carrier,
      trackingNumberLast4: trackingLast4(trackingNumber),
    };
  }

  return {
    ...base,
    auditAction: "order.received",
    actualQty: readOptionalQuantity(body.actualQty),
  };
}

export async function executeOrderAction({
  action,
  orderId,
  body = {},
  context,
  auditLogService,
  orderJobStore,
  now = () => new Date().toISOString(),
}) {
  const acceptedAt = now();
  const actionResult = runOrderAction({ action, orderId, body, context, now: () => acceptedAt });
  const metadata = {
    action,
    review_note: actionResult.reviewNote || "",
  };

  if (actionResult.carrier) {
    metadata.carrier = actionResult.carrier;
    metadata.tracking_number_last4 = actionResult.trackingNumberLast4;
  }
  if (actionResult.actualQty !== undefined) {
    metadata.actual_qty = actionResult.actualQty;
  }

  const auditLog = await auditLogService.record({
    clinicId: context.clinicId,
    actor: { userId: context.userId, role: context.role },
    action: actionResult.auditAction,
    entity: "order",
    entityId: orderId,
    metadata,
    requestId: body.requestId,
  });

  let orderJob = null;
  if (action === "approve") {
    const vendorId = readOptionalText(body.vendorId, { field: "vendor_id", max: 64 }) || "unassigned";
    const maxOrderAmount = readOptionalInteger(body.maxOrderAmount, { field: "max_order_amount" });

    orderJob = await orderJobStore.enqueue({
      clinicId: context.clinicId,
      orderId,
      vendorId,
      requestedBy: actionResult.requestedBy,
      approvedBy: context.userId,
      approvedAt: acceptedAt,
      maxOrderAmount,
      auditId: auditLog.auditId,
    });
  }

  return {
    ...actionResult,
    stateTransition: {
      orderId,
      status: action === "approve" ? "ordered" : action === "reject" ? "rejected" : action === "receive" ? "received" : "ordered",
      acceptedAt,
    },
    auditId: auditLog.auditId,
    orderJobId: orderJob?.jobId,
  };
}
