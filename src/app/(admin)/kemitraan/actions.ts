"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string };

const partnershipSchema = z.object({
  name: z.string().trim().min(1, "Nama kemitraan wajib diisi"),
});

export async function createPartnership(
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = partnershipSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.partnership.create({ data: { name: parsed.data.name } });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Kemitraan sudah ada atau gagal dibuat" };
  }
}

export async function deletePartnership(id: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  const cashierCount = await prisma.user.count({
    where: { subPartnership: { partnershipId: id } },
  });
  if (cashierCount > 0) {
    return {
      ok: false,
      error: "Kemitraan masih memiliki kasir. Pindahkan atau hapus kasir dulu.",
    };
  }
  try {
    await prisma.partnership.delete({ where: { id } });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus kemitraan" };
  }
}

const subPartnershipSchema = z.object({
  partnershipId: z.string().min(1, "Kemitraan wajib dipilih"),
  name: z.string().trim().min(1, "Nama sub kemitraan wajib diisi"),
});

export async function createSubPartnership(
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = subPartnershipSchema.safeParse({
    partnershipId: formData.get("partnershipId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.subPartnership.create({
      data: {
        partnershipId: parsed.data.partnershipId,
        name: parsed.data.name,
      },
    });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sub kemitraan sudah ada atau gagal dibuat" };
  }
}

export async function deleteSubPartnership(id: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  const cashierCount = await prisma.user.count({
    where: { subPartnershipId: id },
  });
  if (cashierCount > 0) {
    return {
      ok: false,
      error: "Sub kemitraan masih memiliki kasir. Pindahkan atau hapus kasir dulu.",
    };
  }
  try {
    await prisma.subPartnership.delete({ where: { id } });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus sub kemitraan" };
  }
}
