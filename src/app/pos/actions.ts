"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createOrder } from "@/lib/order";
import { invalidateMenuCache } from "@/lib/menu";
import { prisma } from "@/lib/db";
import { notifyOrderUpdated } from "@/lib/realtime";
import {
  claimQrCheckout,
  parseCheckoutPayload,
  releaseQrCheckout,
  settleQrCheckout,
} from "@/lib/qr-checkout";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  note: z.string().trim().optional(),
});

const posOrderSchema = z.object({
  lines: z.array(lineSchema).min(1, "Pesanan kosong"),
  type: z.enum(["DINE_IN", "TAKE_AWAY"]),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS"]),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  customerName: z.string().trim().optional(),
  cashierName: z.string().trim().optional(),
  note: z.string().trim().optional(),
  resumingDraftId: z.string().optional(),
});

export type PosOrderInput = z.infer<typeof posOrderSchema>;

export type SubmitResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: string };

export type ActionResult = { ok: boolean; error?: string };

export async function submitPosOrder(
  input: PosOrderInput
): Promise<SubmitResult> {
  const session = await requireRole("OUTLET");

  const parsed = posOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const order = await createOrder({
      lines: parsed.data.lines,
      channel: "CASHIER",
      type: parsed.data.type,
      paymentMethod: parsed.data.paymentMethod,
      status: "PAID",
      discount: parsed.data.discount,
      paidAmount: parsed.data.paidAmount,
      customerName: parsed.data.customerName,
      cashierName: parsed.data.cashierName,
      note: parsed.data.note,
      cashierId: session.user.id,
      deleteDraftId: parsed.data.resumingDraftId,
    });

    await invalidateMenuCache(session.user.id);
    await notifyOrderUpdated(session.user.id);
    revalidatePath("/orders");
    revalidatePath("/pos");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal memproses pesanan",
    };
  }
}

export async function holdPosOrder(input: PosOrderInput): Promise<SubmitResult> {
  const session = await requireRole("OUTLET");

  const parsed = posOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const order = await createOrder({
      lines: parsed.data.lines,
      channel: "CASHIER",
      type: parsed.data.type,
      paymentMethod: parsed.data.paymentMethod,
      status: "DRAFT",
      discount: parsed.data.discount,
      customerName: parsed.data.customerName,
      cashierName: parsed.data.cashierName,
      note: parsed.data.note,
      cashierId: session.user.id,
      skipStock: true,
      deleteDraftId: parsed.data.resumingDraftId,
    });

    await notifyOrderUpdated(session.user.id);
    revalidatePath("/pos");
    revalidatePath("/orders");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal menahan pesanan",
    };
  }
}

export async function claimQrCheckoutAction(
  payload: string
): Promise<
  | { ok: true; checkoutLockToken: string }
  | { ok: false; error: string }
> {
  const session = await requireRole("OUTLET");
  const customerToken = parseCheckoutPayload(payload);
  if (!customerToken) return { ok: false, error: "QR pesanan tidak valid" };

  try {
    const result = await claimQrCheckout({
      customerToken,
      cashierId: session.user.id,
    });
    if (result.ok) {
      revalidatePath("/pos");
      revalidatePath("/orders");
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal mengambil pesanan QR",
    };
  }
}

export async function claimQrOrderByNumberAction(
  orderNumber: string
): Promise<
  | { ok: true; checkoutLockToken: string }
  | { ok: false; error: string }
> {
  const session = await requireRole("OUTLET");
  if (!orderNumber.trim()) return { ok: false, error: "Nomor pesanan tidak valid" };

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
      select: { checkoutToken: true, cashierId: true, channel: true, status: true },
    });
    if (!order?.checkoutToken || order.channel !== "QR" || order.status !== "AWAITING_PAYMENT") {
      return { ok: false, error: "Pesanan tidak ditemukan" };
    }

    const result = await claimQrCheckout({
      customerToken: order.checkoutToken,
      cashierId: session.user.id,
    });
    if (result.ok) {
      revalidatePath("/pos");
      revalidatePath("/orders");
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal mengambil pesanan",
    };
  }
}

export async function releaseQrCheckoutAction(
  checkoutLockToken: string
): Promise<ActionResult> {
  const session = await requireRole("OUTLET");
  try {
    const released = await releaseQrCheckout({
      checkoutLockToken,
      cashierId: session.user.id,
    });
    if (!released) return { ok: false, error: "Kunci checkout tidak ditemukan" };
    revalidatePath("/pos");
    revalidatePath("/orders");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal melepas checkout",
    };
  }
}

export async function discardDraft(orderId: string): Promise<ActionResult> {
  const session = await requireRole("OUTLET");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  // Only cashier holds are plain-deletable: they were created with skipStock,
  // via cancelQrOrder (which restocks) instead.
  if (
    !order ||
    order.cashierId !== session.user.id ||
    order.channel !== "CASHIER" ||
    order.status !== "DRAFT"
  ) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  await prisma.order.delete({ where: { id: orderId } });
  await notifyOrderUpdated(session.user.id);
  revalidatePath("/pos");
  revalidatePath("/orders");
  return { ok: true };
}

export async function settleQrCheckoutAction(
  input: {
    checkoutLockToken: string;
    lines: { itemId: string; quantity: number; note?: string }[];
    type: "DINE_IN" | "TAKE_AWAY";
    paymentMethod: "CASH" | "CARD" | "QRIS";
    paidAmount: number;
    customerName?: string;
    cashierName: string;
    note?: string;
    discount: number;
  }
): Promise<SubmitResult> {
  const session = await requireRole("OUTLET");

  try {
    const result = await settleQrCheckout(
      {
        checkoutLockToken: input.checkoutLockToken,
        lines: input.lines,
        type: input.type,
        paymentMethod: input.paymentMethod,
        paidAmount: input.paidAmount,
        customerName: input.customerName,
        cashierName: input.cashierName,
        note: input.note,
        discount: input.discount,
      },
      session.user.id
    );
    if (!result) return { ok: false, error: "Gagal memproses pembayaran QR" };

    await invalidateMenuCache(session.user.id);
    await notifyOrderUpdated(session.user.id);
    revalidatePath("/orders");
    revalidatePath("/pos");
    return { ok: true, orderId: result.id, orderNumber: result.orderNumber };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal memproses pembayaran QR",
    };
  }
}

export type QrOrderListItem = {
  id: string;
  orderNumber: string;
  tableNumber: string | null;
  customerName: string | null;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export async function listQrOrdersAction(): Promise<
  { ok: true; orders: QrOrderListItem[] } | { ok: false; error: string }
> {
  const session = await requireRole("OUTLET");
  try {
    const orders = await prisma.order.findMany({
      where: {
        cashierId: session.user.id,
        channel: "QR",
        status: "AWAITING_PAYMENT",
      },
      select: {
        id: true,
        orderNumber: true,
        tableNumber: true,
        customerName: true,
        total: true,
        createdAt: true,
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      ok: true,
      orders: orders.map((o) => ({
        ...o,
        itemCount: o.items.length,
        items: undefined,
      })),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal memuat daftar pesanan QR",
    };
  }
}

export async function claimQrOrderByIdAction(
  orderId: string
): Promise<
  | { ok: true; checkoutLockToken: string }
  | { ok: false; error: string }
> {
  const session = await requireRole("OUTLET");
  if (!orderId.trim()) return { ok: false, error: "ID pesanan tidak valid" };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
      select: { checkoutToken: true, channel: true, status: true },
    });
    if (!order?.checkoutToken || order.channel !== "QR" || order.status !== "AWAITING_PAYMENT") {
      return { ok: false, error: "Pesanan tidak ditemukan" };
    }

    const result = await claimQrCheckout({
      customerToken: order.checkoutToken,
      cashierId: session.user.id,
    });
    if (result.ok) {
      revalidatePath("/pos");
      revalidatePath("/orders");
    }
    return result;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal mengambil pesanan",
    };
  }
}
