import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateStockDeltas,
  CHECKOUT_LOCK_TTL_MS,
  CHECKOUT_QR_PREFIX,
  createCheckoutToken,
  isCheckoutToken,
  isCheckoutLockExpired,
  normalizePayment,
  parseCheckoutPayload,
} from "../src/lib/qr-checkout-protocol";

test("checkout tokens are opaque, 256-bit base64url values, and unique", () => {
  const first = createCheckoutToken();
  const second = createCheckoutToken();

  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.match(second, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
});

test("checkout payload parser requires the exact protocol prefix", () => {
  const token = createCheckoutToken();

  assert.equal(parseCheckoutPayload(`${CHECKOUT_QR_PREFIX}${token}`), token);
  assert.equal(parseCheckoutPayload(`sagawa-pos:order:${token}`), null);
  assert.equal(parseCheckoutPayload(`${CHECKOUT_QR_PREFIX}`), null);
  assert.equal(parseCheckoutPayload(`${CHECKOUT_QR_PREFIX}${token} extra`), null);
  assert.equal(parseCheckoutPayload(`${CHECKOUT_QR_PREFIX}not*opaque`), null);
});

test("checkout token validation is strict and payment normalization is server-owned", () => {
  const token = createCheckoutToken();

  assert.equal(isCheckoutToken(token), true);
  assert.equal(isCheckoutToken(`${token}x`), false);
  assert.equal(isCheckoutToken(`${token.slice(0, 42)}!`), false);
  assert.equal(isCheckoutToken("a".repeat(43)), true);
  assert.equal(isCheckoutToken("a".repeat(42)), false);

  assert.deepEqual(normalizePayment("CASH", 150, 100), {
    paidAmount: 150,
    changeAmount: 50,
  });
  assert.deepEqual(normalizePayment("CARD", 999, 100), {
    paidAmount: 100,
    changeAmount: 0,
  });
  assert.throws(() => normalizePayment("CASH", 99, 100), /kurang/i);
});

test("checkout locks expire at five minutes, including the boundary", () => {
  const lockedAt = new Date("2026-07-19T00:00:00.000Z");

  assert.equal(
    isCheckoutLockExpired(
      lockedAt,
      new Date(lockedAt.getTime() + CHECKOUT_LOCK_TTL_MS - 1)
    ),
    false
  );
  assert.equal(
    isCheckoutLockExpired(
      lockedAt,
      new Date(lockedAt.getTime() + CHECKOUT_LOCK_TTL_MS)
    ),
    true
  );
  assert.equal(isCheckoutLockExpired(null, lockedAt), true);
});

test("stock deltas aggregate requested and existing reservations", () => {
  assert.deepEqual(
    calculateStockDeltas(
      [
        { itemId: "a", quantity: 4 },
        { itemId: "b", quantity: 1 },
      ],
      [
        { itemId: "a", quantity: 2 },
        { itemId: "b", quantity: 3 },
        { itemId: "c", quantity: 2 },
      ]
    ),
    [
      { itemId: "a", quantity: 4, existingReservedQuantity: 2, delta: 2 },
      { itemId: "b", quantity: 1, existingReservedQuantity: 3, delta: -2 },
      { itemId: "c", quantity: 0, existingReservedQuantity: 2, delta: -2 },
    ]
  );
});
