export const QR_ORDER_STATUS = "AWAITING_PAYMENT" as const;

export type QrPaymentPreference = "CASH" | "QRIS";

export type NormalizedQrOrderInput = {
  paymentMethod: QrPaymentPreference;
  status: typeof QR_ORDER_STATUS;
};

export type QrOrderSubmitResult =
  | {
      ok: true;
      checkoutToken: string;
      orderNumber: string;
      status: typeof QR_ORDER_STATUS;
    }
  | { ok: false; error: string };

/** Normalizes a customer payment preference; neither preference confirms payment. */
export function normalizeQrOrderInput(input: {
  paymentMethod: unknown;
}): NormalizedQrOrderInput {
  if (input.paymentMethod !== "CASH" && input.paymentMethod !== "QRIS") {
    throw new Error("Preferensi pembayaran tidak valid");
  }
  return {
    paymentMethod: input.paymentMethod,
    status: QR_ORDER_STATUS,
  };
}

/** Builds the customer-safe response and intentionally omits internal order identifiers. */
export function normalizeQrOrderResult(input: {
  checkoutToken: unknown;
  orderNumber: unknown;
  status?: unknown;
}): Extract<QrOrderSubmitResult, { ok: true }> {
  if (typeof input.checkoutToken !== "string" || !input.checkoutToken) {
    throw new Error("Token checkout tidak valid");
  }
  if (typeof input.orderNumber !== "string" || !input.orderNumber) {
    throw new Error("Nomor pesanan tidak valid");
  }
  return {
    ok: true,
    checkoutToken: input.checkoutToken,
    orderNumber: input.orderNumber,
    status: QR_ORDER_STATUS,
  };
}
