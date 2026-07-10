"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/order";
import { invalidateMenuCache } from "@/lib/menu";
import { notifyNewQrOrder } from "@/lib/realtime";
import { isOpenNow } from "@/lib/settings";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  note: z.string().trim().optional(),
});

const qrOrderSchema = z.object({
  tableId: z.string().min(1),
  customerName: z.string().trim().min(1, "Nama wajib diisi"),
  customerPhone: z.string().trim().min(6, "No. telepon tidak valid"),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  type: z.enum(["DINE_IN", "TAKE_AWAY"]),
  lines: z.array(lineSchema).min(1, "Pesanan kosong"),
});

export type QrOrderInput = z.infer<typeof qrOrderSchema>;

export type QrSubmitResult =
  | { ok: true; orderId: string; status: string }
  | { ok: false; error: string };

export async function submitQrOrder(
  input: QrOrderInput
): Promise<QrSubmitResult> {
  const parsed = qrOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const table = await prisma.table.findUnique({
    where: { id: parsed.data.tableId },
    include: { cashier: { select: { businessHours: true } } },
  });
  if (!table) {
    return { ok: false, error: "Meja tidak ditemukan" };
  }

  // Cek jam operasional
  if (table.cashier?.businessHours) {
    try {
      const hours = JSON.parse(table.cashier.businessHours);
      const check = isOpenNow(hours);
      if (!check.open) {
        return { ok: false, error: check.message ?? "Outlet sedang tutup. Silakan pesan kembali saat jam operasional." };
      }
    } catch {
      // parse error — abaikan, biarkan order lanjut
    }
  }

  // CASH -> bayar di kasir (PENDING_PAYMENT); QRIS -> WAITING_CONFIRMATION
  const status =
    parsed.data.paymentMethod === "CASH"
      ? "PENDING_PAYMENT"
      : "WAITING_CONFIRMATION";

  try {
    const order = await createOrder({
      lines: parsed.data.lines,
      channel: "QR",
      type: parsed.data.type,
      paymentMethod: parsed.data.paymentMethod,
      status,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      cashierId: table.cashierId,
      tableId: table.id,
      tableNumber: table.number,
    });

    await invalidateMenuCache();
    await notifyNewQrOrder(table.cashierId, {
      orderId: order.id,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      total: order.total,
      paymentMethod: parsed.data.paymentMethod,
    });

    return { ok: true, orderId: order.id, status };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal mengirim pesanan",
    };
  }
}
