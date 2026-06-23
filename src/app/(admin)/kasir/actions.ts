"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string };

export async function createCashier(formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const subPartnershipId = String(formData.get("subPartnershipId") ?? "").trim();

  if (!username || password.length < 8) {
    return { ok: false, error: "Username dan password (min 8 karakter) wajib diisi" };
  }
  if (!subPartnershipId) {
    return { ok: false, error: "Kemitraan dan sub kemitraan wajib dipilih" };
  }

  const sub = await prisma.subPartnership.findUnique({
    where: { id: subPartnershipId },
  });
  if (!sub) {
    return { ok: false, error: "Sub kemitraan tidak ditemukan" };
  }

  try {
    const { user } = await auth.api.createUser({
      body: {
        name: username,
        email: `${username}@sagawa.pos`,
        password,
        role: "CASHIER",
        data: { username, displayUsername: username },
      },
      headers: await headers(),
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { subPartnershipId },
    });
    revalidatePath("/kasir");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat kasir" };
  }
}

export async function setCashierActive(
  userId: string,
  active: boolean
): Promise<ActionResult> {
  await requireRole("ADMIN");
  try {
    if (active) {
      await auth.api.unbanUser({ body: { userId }, headers: await headers() });
    } else {
      await auth.api.banUser({ body: { userId }, headers: await headers() });
    }
    revalidatePath("/kasir");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui status" };
  }
}

export async function resetCashierPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  await requireRole("ADMIN");
  if (newPassword.length < 8) {
    return { ok: false, error: "Password minimal 8 karakter" };
  }
  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal reset password" };
  }
}

export async function deleteCashier(userId: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  try {
    const orderCount = await prisma.order.count({ where: { cashierId: userId } });
    if (orderCount > 0) {
      return {
        ok: false,
        error: "Kasir memiliki riwayat transaksi. Nonaktifkan saja, jangan hapus.",
      };
    }
    await auth.api.removeUser({ body: { userId }, headers: await headers() });
    revalidatePath("/kasir");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghapus kasir" };
  }
}
