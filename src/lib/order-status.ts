export type HeldStatus =
  | "DRAFT"
  | "PENDING"
  | "PENDING_PAYMENT"
  | "WAITING_CONFIRMATION";

export type OrderStatus = HeldStatus | "PAID" | "CANCELLED";

export const HELD_STATUSES: HeldStatus[] = [
  "DRAFT",
  "PENDING",
  "PENDING_PAYMENT",
  "WAITING_CONFIRMATION",
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PENDING_PAYMENT: "Belum Bayar",
  WAITING_CONFIRMATION: "Menunggu Konfirmasi",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "outline",
  PENDING: "outline",
  PENDING_PAYMENT: "secondary",
  WAITING_CONFIRMATION: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
};

// Status options offered when editing a held order (Draft Sheet & Dashboard).
export const HELD_STATUS_OPTIONS: { value: HeldStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_PAYMENT", label: "Belum Bayar" },
  { value: "WAITING_CONFIRMATION", label: "Menunggu Konfirmasi" },
  { value: "PENDING", label: "Pending" },
];

export function isHeldStatus(status: string): status is HeldStatus {
  return (HELD_STATUSES as string[]).includes(status);
}
