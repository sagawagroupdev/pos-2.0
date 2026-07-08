"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string };

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama outlet wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  partnershipId: z.string().min(1, "Kemitraan wajib dipilih"),
  subPartnershipId: z.string().optional(),
  outletAddress: z.string().optional(),
  outletPhone: z.string().optional(),
  outletPic: z.string().optional(),
  outletFoundedDate: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1, "Nama outlet wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  partnershipId: z.string().min(1, "Kemitraan wajib dipilih"),
  subPartnershipId: z.string().optional(),
  outletAddress: z.string().optional(),
  outletPhone: z.string().optional(),
  outletPic: z.string().optional(),
  outletFoundedDate: z.string().optional(),
});

async function validatePartnership(partnershipId: string, subPartnershipId?: string) {
  const partnership = await prisma.partnership.findUnique({
    where: { id: partnershipId },
    include: { subPartnerships: { select: { id: true } } },
  });
  if (!partnership) return "Kemitraan tidak ditemukan";

  const hasSub = partnership.subPartnerships.length > 0;
  if (hasSub) {
    if (!subPartnershipId) return "Sub kemitraan wajib dipilih";
    if (!partnership.subPartnerships.some((s) => s.id === subPartnershipId)) return "Sub kemitraan tidak valid";
  }
  return null;
}

export async function createCashier(formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    partnershipId: formData.get("partnershipId"),
    subPartnershipId: formData.get("subPartnershipId") || undefined,
    outletAddress: formData.get("outletAddress") || undefined,
    outletPhone: formData.get("outletPhone") || undefined,
    outletPic: formData.get("outletPic") || undefined,
    outletFoundedDate: formData.get("outletFoundedDate") || undefined,
  };

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { name, email, password, partnershipId, subPartnershipId, outletAddress, outletPhone, outletPic, outletFoundedDate } = parsed.data;

  const err = await validatePartnership(partnershipId, subPartnershipId);
  if (err) return { ok: false, error: err };

  // auto-generate username from email prefix + random suffix for uniqueness
  const username = email.split("@")[0] + Math.random().toString(36).slice(2, 6);

  try {
    const { user } = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: "CASHIER",
        data: { username, displayUsername: name },
      },
      headers: await headers(),
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        partnershipId,
        subPartnershipId: subPartnershipId || null,
        outletAddress: outletAddress || null,
        outletPhone: outletPhone || null,
        outletPic: outletPic || null,
        outletFoundedDate: outletFoundedDate ? new Date(outletFoundedDate) : null,
      },
    });
    revalidatePath("/kasir");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal membuat kasir" };
  }
}

export async function updateCashier(userId: string, formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    partnershipId: formData.get("partnershipId"),
    subPartnershipId: formData.get("subPartnershipId") || undefined,
    outletAddress: formData.get("outletAddress") || undefined,
    outletPhone: formData.get("outletPhone") || undefined,
    outletPic: formData.get("outletPic") || undefined,
    outletFoundedDate: formData.get("outletFoundedDate") || undefined,
  };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { name, email, partnershipId, subPartnershipId, outletAddress, outletPhone, outletPic, outletFoundedDate } = parsed.data;

  const err = await validatePartnership(partnershipId, subPartnershipId);
  if (err) return { ok: false, error: err };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        partnershipId,
        subPartnershipId: subPartnershipId || null,
        outletAddress: outletAddress || null,
        outletPhone: outletPhone || null,
        outletPic: outletPic || null,
        outletFoundedDate: outletFoundedDate ? new Date(outletFoundedDate) : null,
      },
    });
    revalidatePath("/kasir");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memperbarui kasir" };
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
