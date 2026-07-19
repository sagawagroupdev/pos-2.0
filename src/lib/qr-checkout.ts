import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeTotals, type CartLine } from "@/lib/order";
import {
  calculateStockDeltas,
  CHECKOUT_LOCK_TTL_MS,
  CHECKOUT_QR_PREFIX,
  createCheckoutToken,
  isCheckoutToken,
  isCheckoutLockExpired,
  normalizePayment,
  parseCheckoutPayload,
} from "@/lib/qr-checkout-protocol";
import {
  notifyQrOrderPaid,
  notifyQrOrderCancelled,
} from "@/lib/realtime";

export {
  calculateStockDeltas,
  CHECKOUT_LOCK_TTL_MS,
  CHECKOUT_QR_PREFIX,
  createCheckoutToken,
  isCheckoutToken,
  isCheckoutLockExpired,
  normalizePayment,
  parseCheckoutPayload,
};

export type ClaimResult =
  | { ok: true; checkoutLockToken: string }
  | { ok: false; error: string };

export type ClaimQrCheckoutInput = {
  customerToken: string;
  cashierId: string;
};

export type LockedQrCheckoutItem = {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  note: string | null;
};

export type LockedQrCheckout = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  tableNumber: string | null;
  type: "DINE_IN" | "TAKE_AWAY";
  requestedPaymentMethod: "CASH" | "CARD" | "QRIS" | null;
  note: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: LockedQrCheckoutItem[];
};

const lineSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.number().int().min(1),
  note: z.string().trim().max(500).optional(),
});

const settleQrCheckoutSchema = z.object({
  checkoutLockToken: z.string().trim().min(1),
  lines: z.array(lineSchema).min(1, "Pesanan kosong"),
  type: z.enum(["DINE_IN", "TAKE_AWAY"]),
  tableNumber: z.string().trim().max(100).optional(),
  customerName: z.string().trim().max(200).optional(),
  cashierName: z.string().trim().min(1).max(200),
  note: z.string().trim().max(500).optional(),
  discount: z.number().finite().min(0),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS"]),
  paidAmount: z.number().finite().min(0),
});

export type SettleQrCheckoutInput = z.infer<typeof settleQrCheckoutSchema>;

export type CancelAwaitingQrOrderInput = {
  orderId?: string;
  checkoutToken?: string;
  cashierId: string;
};

const QR_CHECKOUT_NOT_FOUND = "Pesanan checkout tidak ditemukan";
const QR_CHECKOUT_CONFLICT = "Pesanan sedang diproses kasir lain";
const QR_CHECKOUT_EXPIRED = "Kunci checkout sudah kedaluwarsa";

/** Atomically claims an awaiting QR order for one cashier for five minutes. */
export async function claimQrCheckout({
  customerToken,
  cashierId,
}: ClaimQrCheckoutInput): Promise<ClaimResult> {
  if (!isCheckoutToken(customerToken) || !cashierId) {
    return { ok: false, error: QR_CHECKOUT_NOT_FOUND };
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const lockToken = createCheckoutToken();
    const cutoff = new Date(now.getTime() - CHECKOUT_LOCK_TTL_MS);

    const result = await tx.order.updateMany({
      where: {
        checkoutToken: customerToken,
        cashierId,
        channel: "QR",
        status: "AWAITING_PAYMENT",
        OR: [
          { checkoutLockedAt: null },
          { checkoutLockedAt: { lte: cutoff } },
        ],
      },
      data: {
        checkoutLockToken: lockToken,
        checkoutLockedBy: cashierId,
        checkoutLockedAt: now,
      },
    });

    if (result.count === 1) return { ok: true, checkoutLockToken: lockToken };

    // Only distinguish an active lock; all other states (unknown, paid,
    // cancelled, expired, or another outlet) intentionally look unavailable.
    const conflict = await tx.order.findFirst({
      where: {
      checkoutToken: customerToken,
      channel: "QR",
      cashierId,
      status: "AWAITING_PAYMENT",
        checkoutLockToken: { not: null },
        checkoutLockedAt: { not: null, gt: cutoff },
        checkoutLockedBy: { not: cashierId },
      },
      select: { id: true },
    });
    if (conflict) return { ok: false, error: QR_CHECKOUT_CONFLICT };
    return { ok: false, error: QR_CHECKOUT_NOT_FOUND };
  });
}

/** Returns only fields safe for a cashier page and only for a live owned lock. */
export async function getLockedQrCheckout({
  checkoutLockToken,
  cashierId,
}: {
  checkoutLockToken: string;
  cashierId: string;
}): Promise<LockedQrCheckout | null> {
  if (!isCheckoutToken(checkoutLockToken) || !cashierId) return null;

  const order = await prisma.order.findFirst({
    where: {
      checkoutLockToken,
      checkoutLockedBy: cashierId,
      channel: "QR",
      status: "AWAITING_PAYMENT",
    },
    include: {
      items: {
        select: {
          id: true,
          itemId: true,
          name: true,
          quantity: true,
          price: true,
          note: true,
        },
      },
    },
  });

  if (!order || isCheckoutLockExpired(order.checkoutLockedAt)) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    tableNumber: order.tableNumber,
    type: order.type,
    requestedPaymentMethod: order.requestedPaymentMethod,
    note: order.note,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    items: order.items,
  };
}

/** Releases an owned live lock without changing the order status. */
export async function releaseQrCheckout({
  checkoutLockToken,
  cashierId,
}: {
  checkoutLockToken: string;
  cashierId: string;
}): Promise<boolean> {
  if (!isCheckoutToken(checkoutLockToken) || !cashierId) return false;
  const cutoff = new Date(Date.now() - CHECKOUT_LOCK_TTL_MS);
  const result = await prisma.order.updateMany({
    where: {
      checkoutLockToken,
      checkoutLockedBy: cashierId,
      channel: "QR",
      status: "AWAITING_PAYMENT",
      checkoutLockedAt: { gt: cutoff },
    },
    data: {
      checkoutLockToken: null,
      checkoutLockedBy: null,
      checkoutLockedAt: null,
    },
  });
  return result.count === 1;
}

/**
 * Settles the existing QR order in one transaction. It adjusts only stock
 * deltas, replaces snapshots, and updates that same Order row; no second order
 * is ever inserted.
 */
export async function settleQrCheckout(
  input: SettleQrCheckoutInput,
  cashierId: string
) {
  const parsed = settleQrCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Input pembayaran tidak valid");
  }
  if (!cashierId) throw new Error(QR_CHECKOUT_NOT_FOUND);

  const data = parsed.data;
  if (!isCheckoutToken(data.checkoutLockToken)) {
    throw new Error(QR_CHECKOUT_NOT_FOUND);
  }
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        checkoutLockToken: data.checkoutLockToken,
        checkoutLockedBy: cashierId,
        channel: "QR",
        status: "AWAITING_PAYMENT",
      },
      include: { items: true },
    });

    if (!order) throw new Error(QR_CHECKOUT_NOT_FOUND);
    if (isCheckoutLockExpired(order.checkoutLockedAt)) {
      throw new Error(QR_CHECKOUT_EXPIRED);
    }

    const itemIds = [
      ...new Set([
        ...data.lines.map((line) => line.itemId),
        ...order.items.map((line) => line.itemId),
      ]),
    ];
    const items = await tx.item.findMany({ where: { id: { in: itemIds } } });
    const itemMap = new Map(items.map((item) => [item.id, item]));
    for (const line of data.lines) {
      if (!itemMap.has(line.itemId)) throw new Error("Item tidak ditemukan");
    }

    const requestedLines: CartLine[] = data.lines.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
      note: line.note,
    }));
    const existingLines = order.items.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
    }));
    const stockDeltas = calculateStockDeltas(requestedLines, existingLines);
    for (const stockDelta of stockDeltas) {
      if (stockDelta.delta > 0) {
        const updated = await tx.item.updateMany({
          where: {
            id: stockDelta.itemId,
            stock: { gte: stockDelta.delta },
          },
          data: { stock: { decrement: stockDelta.delta } },
        });
        if (updated.count !== 1) {
          const item = itemMap.get(stockDelta.itemId);
          throw new Error(`Stok ${item?.name ?? "item"} tidak cukup`);
        }
      } else if (stockDelta.delta < 0) {
        await tx.item.updateMany({
          where: { id: stockDelta.itemId },
          data: { stock: { increment: -stockDelta.delta } },
        });
      }
    }

    const settings =
      (await tx.setting.findFirst()) ??
      (await tx.setting.create({ data: { id: "default" } }));
    const totals = computeTotals(
      data.lines.map((line) => ({
        price: itemMap.get(line.itemId)!.price,
        quantity: line.quantity,
      })),
      data.discount,
      settings.taxRate,
      settings.taxEnabled
    );
    const payment = normalizePayment(
      data.paymentMethod,
      data.paidAmount,
      totals.total
    );

    await tx.orderItem.deleteMany({ where: { orderId: order.id } });
    await tx.orderItem.createMany({
      data: data.lines.map((line) => {
        const item = itemMap.get(line.itemId)!;
        return {
          orderId: order.id,
          itemId: item.id,
          name: item.name,
          quantity: line.quantity,
          price: item.price,
          note: line.note ?? null,
        };
      }),
    });

    const finalLockCutoff = new Date(Date.now() - CHECKOUT_LOCK_TTL_MS);
    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        checkoutLockToken: data.checkoutLockToken,
        checkoutLockedBy: cashierId,
        status: "AWAITING_PAYMENT",
        checkoutLockedAt: { gt: finalLockCutoff },
      },
      data: {
        type: data.type,
        tableNumber: data.tableNumber ?? order.tableNumber,
        customerName: data.customerName ?? order.customerName,
        cashierName: data.cashierName,
        note: data.note ?? order.note,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: data.paymentMethod,
        paidAmount: payment.paidAmount,
        changeAmount: payment.changeAmount,
        status: "PAID",
        checkoutLockToken: null,
        checkoutLockedBy: null,
        checkoutLockedAt: null,
      },
    });
    if (updated.count !== 1) throw new Error(QR_CHECKOUT_NOT_FOUND);

    const settled = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    // Notify customer via Pusher after successful transaction
    if (order.checkoutToken) {
      notifyQrOrderPaid(order.checkoutToken).catch(() => {});
    }

    return settled;
  });
}

/** Cancels an awaiting QR order and returns its existing reservation to stock. */
export async function cancelAwaitingQrOrder({
  orderId,
  checkoutToken,
  cashierId,
}: CancelAwaitingQrOrderInput): Promise<boolean> {
  if ((!orderId && !checkoutToken) || !cashierId) return false;

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - CHECKOUT_LOCK_TTL_MS);
    const order = await tx.order.findFirst({
      where: {
        ...(orderId ? { id: orderId } : { checkoutToken }),
        cashierId,
        channel: "QR",
        status: "AWAITING_PAYMENT",
      },
      include: { items: true },
    });
    if (!order) return false;

    const activeLock =
      order.checkoutLockedAt &&
      !isCheckoutLockExpired(order.checkoutLockedAt) &&
      order.checkoutLockedBy &&
      order.checkoutLockedBy !== cashierId;
    if (activeLock) return false;

    // Preserve the lock state observed by this cancellation attempt. If a
    // claim races after the read, an active replacement lock no longer matches
    // this predicate and cancellation fails without touching stock.
    const ownedLiveLock =
      order.checkoutLockedBy === cashierId &&
      order.checkoutLockToken !== null &&
      order.checkoutLockedAt !== null &&
      order.checkoutLockedAt.getTime() > cutoff.getTime();
    const cancelled = await tx.order.updateMany({
      where: {
        id: order.id,
        cashierId,
        channel: "QR",
        status: "AWAITING_PAYMENT",
        OR: [
          { checkoutLockedAt: null },
          { checkoutLockedAt: { lte: cutoff } },
          ...(ownedLiveLock
            ? [
                {
                  checkoutLockToken: order.checkoutLockToken,
                  checkoutLockedBy: cashierId,
                  checkoutLockedAt: { gt: cutoff },
                },
              ]
            : []),
        ],
      },
      data: {
        status: "CANCELLED",
        checkoutLockToken: null,
        checkoutLockedBy: null,
        checkoutLockedAt: null,
      },
    });
    if (cancelled.count !== 1) return false;

    for (const line of order.items) {
      await tx.item.updateMany({
        where: { id: line.itemId },
        data: { stock: { increment: line.quantity } },
      });
    }

    // Notify customer via Pusher after successful cancellation
    if (order.checkoutToken) {
      notifyQrOrderCancelled(order.checkoutToken).catch(() => {});
    }
    return true;
  });
}
