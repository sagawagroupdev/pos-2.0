import { randomBytes } from "node:crypto";
import { CHECKOUT_QR_PREFIX } from "./checkout-qr-prefix";

export { CHECKOUT_QR_PREFIX } from "./checkout-qr-prefix";
export const CHECKOUT_LOCK_TTL_MS = 5 * 60 * 1000;

/** Creates a 256-bit opaque token suitable for embedding in a QR payload. */
export function createCheckoutToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Accepts only tokens produced by createCheckoutToken. */
export function isCheckoutToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/**
 * Extracts a checkout token from the protocol payload. Payloads are deliberately
 * strict so a QR scanner cannot smuggle arbitrary data into the checkout flow.
 */
export function parseCheckoutPayload(payload: string): string | null {
  if (typeof payload !== "string") return null;
  const match = new RegExp(
    `^${escapeRegExp(CHECKOUT_QR_PREFIX)}([A-Za-z0-9_-]{43})$`
  ).exec(payload);
  return match?.[1] && isCheckoutToken(match[1]) ? match[1] : null;
}

export type CheckoutPaymentMethod = "CASH" | "CARD" | "QRIS";

export type NormalizedPayment = {
  paidAmount: number;
  changeAmount: number;
};

/**
 * Applies the server-owned payment invariant shared by POS and QR settlement:
 * cash must cover the total, while card/QRIS are always recorded at the exact
 * computed total regardless of any client-provided amount.
 */
export function normalizePayment(
  paymentMethod: CheckoutPaymentMethod,
  paidAmount: number,
  total: number
): NormalizedPayment {
  if (!Number.isFinite(paidAmount) || !Number.isFinite(total) || total < 0) {
    throw new Error("Jumlah pembayaran tidak valid");
  }
  if (paymentMethod === "CASH") {
    if (paidAmount < total) throw new Error("Jumlah pembayaran kurang dari total");
    return { paidAmount, changeAmount: Math.max(0, paidAmount - total) };
  }
  return { paidAmount: total, changeAmount: 0 };
}

export function isCheckoutLockExpired(
  lockedAt: Date | null,
  now = new Date()
): boolean {
  return !lockedAt || now.getTime() - lockedAt.getTime() >= CHECKOUT_LOCK_TTL_MS;
}

export type StockReservationLine = {
  itemId: string;
  quantity: number;
};

export type StockDelta = StockReservationLine & {
  existingReservedQuantity: number;
  delta: number;
};

/**
 * Calculates the stock change needed to move an existing reservation to the
 * requested lines. Existing-only lines are included with a zero new quantity
 * so callers can return their reservations to stock.
 */
export function calculateStockDeltas(
  requestedLines: readonly StockReservationLine[],
  existingLines: readonly StockReservationLine[]
): StockDelta[] {
  const requested = new Map<string, number>();
  const existing = new Map<string, number>();
  const ids: string[] = [];

  for (const line of requestedLines) {
    if (!requested.has(line.itemId)) ids.push(line.itemId);
    requested.set(line.itemId, (requested.get(line.itemId) ?? 0) + line.quantity);
  }
  for (const line of existingLines) {
    if (!existing.has(line.itemId) && !requested.has(line.itemId)) {
      ids.push(line.itemId);
    }
    existing.set(line.itemId, (existing.get(line.itemId) ?? 0) + line.quantity);
  }

  return ids.map((itemId) => {
    const quantity = requested.get(itemId) ?? 0;
    const existingReservedQuantity = existing.get(itemId) ?? 0;
    return {
      itemId,
      quantity,
      existingReservedQuantity,
      delta: quantity - existingReservedQuantity,
    };
  });
}

// Singular alias keeps the arithmetic useful to callers validating one line.
export function calculateStockDelta(
  newQuantity: number,
  existingReservedQuantity: number
): number {
  return newQuantity - existingReservedQuantity;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
