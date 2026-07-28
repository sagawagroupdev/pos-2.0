import "server-only";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  createCheckoutToken,
  isCheckoutToken,
  normalizePayment,
} from "@/lib/qr-checkout-protocol";

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

function generateOrderNumber(date: Date): string {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRX-${datePart}-${rand}`;
}

export type CreateOrderInput = {
  lines: CartLine[];
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  /** Final payment method. Awaiting QR orders intentionally leave this null. */
  paymentMethod?: "CASH" | "CARD" | "QRIS" | null;
  status: "DRAFT" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
  requestedPaymentMethod?: "CASH" | "CARD" | "QRIS" | null;
  checkoutToken?: string | null;
  discount?: number;
  paidAmount?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  cashierId?: string;
  cashierName?: string;
  tableId?: string;
  tableNumber?: string;
  skipStock?: boolean;
  deleteDraftId?: string;
};

export async function createOrder(input: CreateOrderInput) {
  if (!input.lines.length) {
    throw new Error("Pesanan kosong");
  }
  if (input.status === "PAID" && !input.paymentMethod) {
    throw new Error("Metode pembayaran wajib diisi untuk pesanan lunas");
  }

  if (!input.cashierId) {
    throw new Error("cashierId (outletId) wajib diisi");
  }
  const settings = await getSettings(input.cashierId);
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

  const isAwaitingQrOrder =
    input.channel === "QR" && input.status === "AWAITING_PAYMENT";
  if (
    input.checkoutToken !== undefined &&
    input.checkoutToken !== null &&
    (!isAwaitingQrOrder || !isCheckoutToken(input.checkoutToken))
  ) {
    throw new Error("Token checkout tidak valid");
  }
  const paymentMethod = isAwaitingQrOrder ? null : input.paymentMethod ?? null;
  const requestedPaymentMethod =
    input.requestedPaymentMethod ??
    (isAwaitingQrOrder ? input.paymentMethod ?? null : null);
  const checkoutToken = isAwaitingQrOrder
    ? input.checkoutToken ?? createCheckoutToken()
    : null;
  const suppliedPaidAmount = input.paidAmount ?? 0;
  const payment =
    input.status === "PAID"
      ? normalizePayment(input.paymentMethod!, suppliedPaidAmount, totals.total)
      : { paidAmount: suppliedPaidAmount, changeAmount: 0 };
  const paidAmount = payment.paidAmount;
  const changeAmount = payment.changeAmount;

  return prisma.$transaction(async (tx) => {
    if (input.deleteDraftId) {
      await tx.order.deleteMany({
        where: { id: input.deleteDraftId, status: "DRAFT" },
      });
    }

    let order;
    for (let attempt = 0; ; attempt++) {
      const orderNumber = generateOrderNumber(new Date());
      try {
        order = await tx.order.create({
          data: {
            orderNumber,
            channel: input.channel,
            type: input.type,
            paymentMethod,
            requestedPaymentMethod,
            checkoutToken,
            status: input.status,
            cashierId: input.cashierId ?? null,
            cashierName: input.cashierName ?? null,
            tableId: input.tableId ?? null,
            tableNumber: input.tableNumber ?? null,
            customerName: input.customerName ?? null,
            customerPhone: input.customerPhone ?? null,
            customerEmail: input.customerEmail ?? null,
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
        break;
      } catch (e) {
        if (isUniqueOrderNumberError(e) && attempt < 5) continue;
        throw e;
      }
    }

    if (!input.skipStock) {
      for (const r of resolved) {
        const stockUpdate = await tx.item.updateMany({
          where: { id: r.item.id, stock: { gte: r.quantity } },
          data: { stock: { decrement: r.quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new Error(`Stok ${r.item.name} tidak cukup`);
        }
      }
    }

    return order;
  });
}

function isUniqueOrderNumberError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}
