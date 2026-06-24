"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createOrder } from "@/lib/order";
import { invalidateMenuCache } from "@/lib/menu";
import { prisma } from "@/lib/db";

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
  const session = await requireRole("CASHIER");

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
      cashierId: session.user.id,
      deleteDraftId: parsed.data.resumingDraftId,
    });

    await invalidateMenuCache();
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
  const session = await requireRole("CASHIER");

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
      note: parsed.data.note,
      cashierId: session.user.id,
      skipStock: true,
      deleteDraftId: parsed.data.resumingDraftId,
    });

    revalidatePath("/pos");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal menahan pesanan",
    };
  }
}

export async function discardDraft(orderId: string): Promise<ActionResult> {
  const session = await requireRole("CASHIER");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.cashierId !== session.user.id || order.status !== "DRAFT") {
    return { ok: false, error: "Draft tidak ditemukan" };
  }

  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/pos");
  return { ok: true };
}
