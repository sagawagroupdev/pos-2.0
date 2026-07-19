import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQrOrderInput,
  normalizeQrOrderResult,
} from "../src/app/order/[tableId]/qr-order-contract";
import { CHECKOUT_QR_PREFIX as CLIENT_SAFE_CHECKOUT_QR_PREFIX } from "../src/lib/checkout-qr-prefix";

test("client-safe checkout prefix is the exact protocol prefix", () => {
  assert.equal(CLIENT_SAFE_CHECKOUT_QR_PREFIX, "sagawa-pos:checkout:");
});

test("Cash preference always submits as awaiting payment", () => {
  const input = normalizeQrOrderInput({ paymentMethod: "CASH" });
  assert.deepEqual(input, {
    paymentMethod: "CASH",
    status: "AWAITING_PAYMENT",
  });
});

test("QRIS preference always submits as awaiting payment", () => {
  const input = normalizeQrOrderInput({ paymentMethod: "QRIS" });
  assert.deepEqual(input, {
    paymentMethod: "QRIS",
    status: "AWAITING_PAYMENT",
  });
});

test("submit result exposes opaque checkout token and order number, never order id", () => {
  const result = normalizeQrOrderResult({
    checkoutToken: "opaque-token",
    orderNumber: "ORD-001",
    status: "AWAITING_PAYMENT",
  });
  assert.deepEqual(result, {
    ok: true,
    checkoutToken: "opaque-token",
    orderNumber: "ORD-001",
    status: "AWAITING_PAYMENT",
  });
  assert.equal("orderId" in result, false);
});
