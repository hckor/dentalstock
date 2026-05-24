export function resolveReviewStatus(nextStatus = "rejected") {
  return nextStatus === "hold" ? "hold" : "rejected";
}

export function buildReviewedOrder({ order, resolvedStatus, currentUserName, reviewedAt, reviewNote = "" }) {
  return {
    ...order,
    status: resolvedStatus,
    reviewed_by: currentUserName,
    reviewed_at: reviewedAt,
    review_note: reviewNote,
  };
}

export function buildReviewAuditMetadata({ item, order, reviewNote = "" }) {
  return {
    item_id: item.id,
    item_name: item.name,
    qty: order.qty,
    review_note: reviewNote || "",
  };
}

export function buildReviewNotification({ item, currentUserName, reviewNote = "", isHold, createdAt }) {
  return {
    id: `n${Date.now()}`,
    type: isHold ? "order_hold" : "order_rejected",
    item_id: item.id,
    message: `${item.name} 발주가 ${isHold ? "보류" : "거절"}되었습니다`,
    sub: `${currentUserName} · ${reviewNote || "사유 없음"}`,
    is_read: false,
    created_at: createdAt,
  };
}

export function getReviewAuditAction(isHold) {
  return isHold ? "order.held" : "order.rejected";
}

export function getReviewToast(isHold) {
  return isHold ? "발주 요청이 보류되었습니다" : "발주 요청이 거절되었습니다";
}

export function getReviewFailureToast(isHold) {
  return isHold ? "발주 보류 저장에 실패했습니다. 다시 시도해주세요." : "발주 반려 저장에 실패했습니다. 다시 시도해주세요.";
}
