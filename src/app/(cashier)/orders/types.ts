import type { OrderStatus } from "@/lib/order-status";

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  note: string | null;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  transactionDate: string;
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  status: OrderStatus;
  paymentMethod: "CASH" | "CARD" | "QRIS";
  customerName: string | null;
  tableNumber: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  items: OrderItem[];
};
