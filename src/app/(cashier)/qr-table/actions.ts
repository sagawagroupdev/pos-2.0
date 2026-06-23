"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string };

const tableSchema = z.object({
  number: z.string().trim().min(1, "Nomor meja wajib diisi"),
  name: z.string().trim().optional(),
});

export async function createTable(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("CASHIER");
  const parsed = tableSchema.safeParse({
    number: formData.get("number"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.table.create({
      data: {
        number: parsed.data.number,
        name: parsed.data.name || null,
        cashierId: session.user.id,
      },
    });
    revalidatePath("/qr-table");
    return { ok: true };
  } catch {
    return { ok: false, error: "Nomor meja sudah ada" };
  }
}

export async function deleteTable(id: string): Promise<ActionResult> {
  const session = await requireRole("CASHIER");
  const table = await prisma.table.findUnique({ where: { id } });
  if (!table || table.cashierId !== session.user.id) {
    return { ok: false, error: "Meja tidak ditemukan" };
  }
  const orderCount = await prisma.order.count({ where: { tableId: id } });
  if (orderCount > 0) {
    return { ok: false, error: "Meja memiliki riwayat pesanan, tidak bisa dihapus" };
  }
  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/qr-table");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus meja" };
  }
}
