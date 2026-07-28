"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notifyOrderUpdated } from "@/lib/realtime";

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
  const session = await requireRole("OUTLET");

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
  revalidatePath("/orders");
  return { ok: true };
}
