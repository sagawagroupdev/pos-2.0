import type { MenuCategory } from "@/lib/menu";

export type MenuItem = MenuCategory["items"][number];

export type CartItem = {
  itemId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  note: string;
};

export type PaymentMethod = "CASH" | "QRIS";

export type OrderType = "DINE_IN" | "TAKE_AWAY";

export type Stage = "orderType" | "menu" | "confirm" | "checkout" | "done";
