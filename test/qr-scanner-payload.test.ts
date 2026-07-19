import assert from "node:assert/strict";
import test from "node:test";

import { isCheckoutScannerPayload } from "../src/app/pos/qr-scanner-payload";
import { CHECKOUT_QR_PREFIX } from "../src/lib/checkout-qr-prefix";

const OPAQUE_TOKEN = "a".repeat(43);

test("accepts an exact checkout QR payload", () => {
  assert.equal(
    isCheckoutScannerPayload(`${CHECKOUT_QR_PREFIX}${OPAQUE_TOKEN}`),
    true
  );
});

test("rejects empty, database-looking, and unrelated QR payloads", () => {
  assert.equal(isCheckoutScannerPayload(""), false);
  assert.equal(isCheckoutScannerPayload("cm5x8pn7w0001qwerty123456"), false);
  assert.equal(isCheckoutScannerPayload("https://example.com/orders/123"), false);
});
