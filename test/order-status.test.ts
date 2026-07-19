import assert from "node:assert/strict";
import test from "node:test";

import {
  isAwaitingPaymentStatus,
  isDraftStatus,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "../src/lib/order-status";

test("the persisted order statuses have the four customer-facing labels", () => {
  const labels: Record<OrderStatus, string> = {
    DRAFT: "Draft",
    AWAITING_PAYMENT: "Menunggu Pembayaran",
    PAID: "Lunas",
    CANCELLED: "Dibatalkan",
  };

  assert.deepEqual(ORDER_STATUS_LABEL, labels);
});

test("only DRAFT is eligible to continue or delete", () => {
  assert.equal(isDraftStatus("DRAFT"), true);
  assert.equal(isDraftStatus("AWAITING_PAYMENT"), false);
  assert.equal(isDraftStatus("PAID"), false);
  assert.equal(isDraftStatus("CANCELLED"), false);
  assert.equal(isAwaitingPaymentStatus("AWAITING_PAYMENT"), true);
});
