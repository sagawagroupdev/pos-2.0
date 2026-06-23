"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createOrder } from "@/lib/order";
import { invalidateMenuCache } from "@/lib/menu";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  note: z.string().trim().optional(),
});

const posOrderSchema = z.object({
  lines: z.array(lineSchema).min(1, "Pesanan kosong"),
  type: z.enum(["DINE_IN", "TAKE_AWAY"]),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  customerName: z.string().trim().optional(),
});

export type PosOrderInput = z.infer<typeof posOrderSchema>;

export type SubmitResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

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
    });

    await invalidateMenuCache();
    revalidatePath("/orders");
    return { ok: true, orderId: order.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal memproses pesanan",
    };
  }
}
