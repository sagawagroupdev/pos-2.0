import { CHECKOUT_QR_PREFIX } from "@/lib/checkout-qr-prefix";

const OPAQUE_CHECKOUT_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function isCheckoutScannerPayload(payload: string): boolean {
  if (!payload.startsWith(CHECKOUT_QR_PREFIX)) return false;
  return OPAQUE_CHECKOUT_TOKEN.test(payload.slice(CHECKOUT_QR_PREFIX.length));
}
