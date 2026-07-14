"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notifyOrderUpdated } from "@/lib/realtime";
import { notifyCashierApp } from "@/lib/go-realtime";

export type ActionResult = { ok: boolean; error?: string };

const deleteReasonSchema = z
  .string()
  .trim()
  .min(3, "Alasan penghapusan minimal 3 karakter")
  .max(500, "Alasan terlalu panjang");

export async function deleteOrderHistory(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  const session = await requireRole("CASHIER");

  const parsedReason = deleteReasonSchema.safeParse(reason);
  if (!parsedReason.success) {
    return { ok: false, error: parsedReason.error.issues[0].message };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.cashierId !== session.user.id || order.deletedAt) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date(), deleteReason: parsedReason.data },
  });

  await notifyOrderUpdated(session.user.id);
  await notifyCashierApp({
    cashierId: session.user.id,
    event: "order-updated",
    orderId,
  });
  revalidatePath("/orders");
  return { ok: true };
}

export async function confirmQrOrder(orderId: string): Promise<ActionResult> {
  const session = await requireRole("CASHIER");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.cashierId !== session.user.id) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }
  if (order.status === "PAID") {
    return { ok: false, error: "Pesanan sudah lunas" };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", paidAmount: order.total },
  });
  await notifyOrderUpdated(session.user.id);
  await notifyCashierApp({
    cashierId: session.user.id,
    event: "order-updated",
    orderId,
  });
  revalidatePath("/orders");
  revalidatePath("/pos");
  return { ok: true };
}

export async function cancelQrOrder(orderId: string): Promise<ActionResult> {
  const session = await requireRole("CASHIER");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.cashierId !== session.user.id) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }
  if (order.status === "PAID") {
    return { ok: false, error: "Pesanan lunas tidak bisa dibatalkan" };
  }

  await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const it of items) {
      await tx.item.update({
        where: { id: it.itemId },
        data: { stock: { increment: it.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });

  await notifyOrderUpdated(session.user.id);
  await notifyCashierApp({
    cashierId: session.user.id,
    event: "order-updated",
    orderId,
  });
  revalidatePath("/orders");
  revalidatePath("/pos");
  return { ok: true };
}
