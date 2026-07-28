"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/order";
import { invalidateMenuCache } from "@/lib/menu";
import { notifyNewQrOrder } from "@/lib/realtime";
import { isOpenNow } from "@/lib/settings";
import { createCheckoutToken } from "@/lib/qr-checkout-protocol";
import {
  normalizeQrOrderInput,
  normalizeQrOrderResult,
  QR_ORDER_STATUS,
  type QrOrderSubmitResult,
} from "./qr-order-contract";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1),
  note: z.string().trim().optional(),
});

const qrOrderSchema = z.object({
  tableId: z.string().min(1),
  customerName: z.string().trim().min(1, "Nama wajib diisi"),
  customerPhone: z.string().trim().optional().or(z.literal("")),
  customerEmail: z.string().trim().email("Format email tidak valid").optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  type: z.enum(["DINE_IN", "TAKE_AWAY"]),
  note: z.string().trim().optional(),
  lines: z.array(lineSchema).min(1, "Pesanan kosong"),
});

export type QrOrderInput = z.infer<typeof qrOrderSchema>;

export type QrSubmitResult = QrOrderSubmitResult;

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
    }
  }

  const preference = normalizeQrOrderInput(parsed.data);
  const checkoutToken = createCheckoutToken();

  try {
    const order = await createOrder({
      lines: parsed.data.lines,
      note: parsed.data.note,
      channel: "QR",
      type: parsed.data.type,
      paymentMethod: undefined,
      requestedPaymentMethod: preference.paymentMethod,
      checkoutToken,
      status: QR_ORDER_STATUS,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone || undefined,
      customerEmail: parsed.data.customerEmail || undefined,
      cashierId: table.cashierId,
      tableId: table.id,
      tableNumber: table.number,
    });

    await invalidateMenuCache(table.cashierId);
    await notifyNewQrOrder(table.cashierId, {
      orderId: order.id,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      total: order.total,
      requestedPaymentMethod: preference.paymentMethod,
    });

    return normalizeQrOrderResult({ checkoutToken, orderNumber: order.orderNumber, status: QR_ORDER_STATUS });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal mengirim pesanan",
    };
  }
}
