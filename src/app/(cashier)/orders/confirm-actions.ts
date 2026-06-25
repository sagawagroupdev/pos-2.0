"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notifyOrderUpdated } from "@/lib/realtime";

export type ActionResult = { ok: boolean; error?: string };

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
  revalidatePath("/orders");
  revalidatePath("/pos");
  return { ok: true };
}
