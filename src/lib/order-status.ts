export type OrderStatus =
  | "DRAFT"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  AWAITING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "outline",
  AWAITING_PAYMENT: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
};

export function isDraftStatus(status: string): status is "DRAFT" {
  return status === "DRAFT";
}

export function isAwaitingPaymentStatus(
  status: string,
): status is "AWAITING_PAYMENT" {
  return status === "AWAITING_PAYMENT";
}
