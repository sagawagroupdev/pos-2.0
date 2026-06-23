import "server-only";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export type CartLine = {
  itemId: string;
  quantity: number;
  note?: string;
};

export type OrderTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export function computeTotals(
  lines: { price: number; quantity: number }[],
  discount: number,
  taxRate: number,
  taxEnabled: boolean
): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = taxEnabled ? Math.round(afterDiscount * (taxRate / 100)) : 0;
  const total = afterDiscount + tax;
  return { subtotal, discount, tax, total };
}

export type CreateOrderInput = {
  lines: CartLine[];
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  paymentMethod: "CASH" | "QRIS";
  status: "PENDING" | "PENDING_PAYMENT" | "WAITING_CONFIRMATION" | "PAID";
  discount?: number;
  paidAmount?: number;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  cashierId?: string;
  tableId?: string;
  tableNumber?: string;
};

export async function createOrder(input: CreateOrderInput) {
  if (!input.lines.length) {
    throw new Error("Pesanan kosong");
  }

  const settings = await getSettings();
  const itemIds = input.lines.map((l) => l.itemId);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
  });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const resolved = input.lines.map((line) => {
    const item = itemMap.get(line.itemId);
    if (!item) throw new Error(`Item tidak ditemukan: ${line.itemId}`);
    if (line.quantity < 1) throw new Error("Kuantitas tidak valid");
    if (item.stock < line.quantity) {
      throw new Error(`Stok ${item.name} tidak cukup`);
    }
    return { item, quantity: line.quantity, note: line.note };
  });

  const discount = input.discount ?? 0;
  const totals = computeTotals(
    resolved.map((r) => ({ price: r.item.price, quantity: r.quantity })),
    discount,
    settings.taxRate,
    settings.taxEnabled
  );

  const paidAmount = input.paidAmount ?? 0;
  const changeAmount =
    input.status === "PAID" && input.paymentMethod === "CASH"
      ? Math.max(0, paidAmount - totals.total)
      : 0;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        channel: input.channel,
        type: input.type,
        paymentMethod: input.paymentMethod,
        status: input.status,
        cashierId: input.cashierId ?? null,
        tableId: input.tableId ?? null,
        tableNumber: input.tableNumber ?? null,
        customerName: input.customerName ?? null,
        customerPhone: input.customerPhone ?? null,
        note: input.note ?? null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paidAmount,
        changeAmount,
        items: {
          create: resolved.map((r) => ({
            itemId: r.item.id,
            name: r.item.name,
            quantity: r.quantity,
            price: r.item.price,
            note: r.note ?? null,
          })),
        },
      },
      include: { items: true },
    });

    for (const r of resolved) {
      await tx.item.update({
        where: { id: r.item.id },
        data: { stock: { decrement: r.quantity } },
      });
    }

    return order;
  });
}
