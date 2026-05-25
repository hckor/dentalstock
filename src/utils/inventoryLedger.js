const POSITIVE_TYPES = new Set(["in"]);
const NEGATIVE_TYPES = new Set(["out"]);

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function getTransactionItemId(transaction = {}) {
  return transaction.item_id ?? transaction.itemId ?? transaction.item?.id ?? null;
}

function getTransactionQuantity(transaction = {}) {
  return toFiniteNumber(transaction.qty ?? transaction.quantity, 0);
}

function getTransactionTime(transaction = {}) {
  const time = Date.parse(transaction.created_at ?? transaction.createdAt ?? "");
  return Number.isFinite(time) ? time : 0;
}

function compareTransactionsAscending(a, b) {
  return getTransactionTime(a) - getTransactionTime(b) || String(a.id ?? "").localeCompare(String(b.id ?? ""));
}

export function getTransactionDelta(transaction = {}) {
  const type = transaction.type;

  if (POSITIVE_TYPES.has(type)) return Math.max(0, getTransactionQuantity(transaction));
  if (NEGATIVE_TYPES.has(type)) return -Math.max(0, getTransactionQuantity(transaction));

  if (type === "adjust") {
    const explicitDelta = toFiniteNumber(transaction.delta, null);
    if (explicitDelta !== null) return explicitDelta;

    const beforeQty = toFiniteNumber(transaction.before_qty ?? transaction.beforeQty, null);
    const afterQty = toFiniteNumber(transaction.after_qty ?? transaction.afterQty, null);
    if (beforeQty !== null && afterQty !== null) return afterQty - beforeQty;
  }

  return 0;
}

export function applyTransactionToStock(currentQty, transaction = {}) {
  const beforeQty = toFiniteNumber(currentQty, 0);
  const type = transaction.type;

  if (type === "adjust") {
    const afterQty = toFiniteNumber(transaction.after_qty ?? transaction.afterQty, null);
    if (afterQty !== null) return afterQty;
  }

  return beforeQty + getTransactionDelta(transaction);
}

export function computeStockFromTransactions(transactions = [], options = {}) {
  const { itemId = null, initialQty = 0 } = options;
  const targetItemId = itemId === null || itemId === undefined ? null : String(itemId);
  const relevantTransactions = (Array.isArray(transactions) ? transactions : [])
    .filter(transaction => {
      if (!targetItemId) return true;
      const transactionItemId = getTransactionItemId(transaction);
      return transactionItemId !== null && String(transactionItemId) === targetItemId;
    })
    .sort(compareTransactionsAscending);

  return relevantTransactions.reduce(
    (currentQty, transaction) => applyTransactionToStock(currentQty, transaction),
    toFiniteNumber(initialQty, 0)
  );
}

export function validateStockAdjustment({ currentQty = 0, type, qty, afterQty, delta } = {}) {
  const beforeQty = toFiniteNumber(currentQty, null);
  if (beforeQty === null || beforeQty < 0) {
    return { ok: false, code: "invalid_current_qty", beforeQty: beforeQty ?? 0 };
  }

  if (type === "adjust") {
    const nextQty = toFiniteNumber(afterQty, null);
    const explicitDelta = toFiniteNumber(delta, null);
    const resolvedAfterQty = nextQty !== null ? nextQty : explicitDelta !== null ? beforeQty + explicitDelta : null;

    if (resolvedAfterQty === null) {
      return { ok: false, code: "invalid_adjustment_qty", beforeQty };
    }

    if (resolvedAfterQty < 0) {
      return {
        ok: false,
        code: "negative_stock",
        beforeQty,
        afterQty: resolvedAfterQty,
        delta: resolvedAfterQty - beforeQty,
      };
    }

    return {
      ok: true,
      type,
      qty: Math.abs(resolvedAfterQty - beforeQty),
      beforeQty,
      afterQty: resolvedAfterQty,
      delta: resolvedAfterQty - beforeQty,
    };
  }

  const quantity = toFiniteNumber(qty, null);
  if (!POSITIVE_TYPES.has(type) && !NEGATIVE_TYPES.has(type)) {
    return { ok: false, code: "invalid_stock_transaction_type", beforeQty };
  }

  if (quantity === null || quantity <= 0) {
    return { ok: false, code: "invalid_stock_transaction_quantity", beforeQty };
  }

  const movement = POSITIVE_TYPES.has(type) ? quantity : -quantity;
  const resolvedAfterQty = beforeQty + movement;

  if (resolvedAfterQty < 0) {
    return {
      ok: false,
      code: "insufficient_stock",
      type,
      qty: quantity,
      beforeQty,
      afterQty: resolvedAfterQty,
      delta: movement,
    };
  }

  return {
    ok: true,
    type,
    qty: quantity,
    beforeQty,
    afterQty: resolvedAfterQty,
    delta: movement,
  };
}

export function getTransactionIdempotencyKey(transaction = {}) {
  const key = transaction.idempotency_key ?? transaction.idempotencyKey ?? transaction.intent_key ?? transaction.intentKey;
  const normalizedKey = normalizeText(key);
  return normalizedKey || null;
}

function getTransactionSourceKey(transaction = {}) {
  const sourceId = transaction.source_id
    ?? transaction.sourceId
    ?? transaction.order_id
    ?? transaction.orderId
    ?? transaction.surgery_id
    ?? transaction.surgeryId
    ?? transaction.stocktake_id
    ?? transaction.stocktakeId;

  if (sourceId === null || sourceId === undefined || sourceId === "") return null;

  const source = transaction.source
    ?? (transaction.order_id || transaction.orderId ? "order" : null)
    ?? (transaction.surgery_id || transaction.surgeryId ? "surgery" : null)
    ?? (transaction.stocktake_id || transaction.stocktakeId ? "stocktake" : null)
    ?? "transaction";

  return `${normalizeText(source)}:${normalizeText(sourceId)}`;
}

export function buildTransactionIntentKey(transaction = {}, options = {}) {
  const idempotencyKey = getTransactionIdempotencyKey(transaction);
  if (idempotencyKey) return `idempotency:${idempotencyKey}`;

  const sourceKey = getTransactionSourceKey(transaction);
  if (!sourceKey && !options.allowDerivedIntent) return null;

  const itemId = getTransactionItemId(transaction);
  const type = normalizeText(transaction.type);
  const quantity = Math.max(0, getTransactionQuantity(transaction));
  const note = normalizeText(transaction.note ?? transaction.reason);
  const actor = options.includeActor === false ? "" : normalizeText(transaction.user ?? transaction.actor_id ?? transaction.actorId);

  return [
    sourceKey || "derived",
    `item:${normalizeText(itemId)}`,
    `type:${type}`,
    `qty:${quantity}`,
    `note:${note}`,
    `actor:${actor}`,
  ].join("|");
}

export function findDuplicateTransactionIntent(transactions = [], transaction = {}, options = {}) {
  const candidateKey = buildTransactionIntentKey(transaction, options);
  if (!candidateKey) return null;

  return (Array.isArray(transactions) ? transactions : []).find(existing => (
    existing !== transaction && buildTransactionIntentKey(existing, options) === candidateKey
  )) || null;
}

export function hasDuplicateTransactionIntent(transactions = [], transaction = {}, options = {}) {
  return Boolean(findDuplicateTransactionIntent(transactions, transaction, options));
}
