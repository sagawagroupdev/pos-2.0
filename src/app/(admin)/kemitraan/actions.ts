"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { uploadImage, deleteImage } from "@/lib/r2";
import type { PartnershipStatus } from "@/generated/prisma/client";

export type ActionResult = { ok: boolean; error?: string };

const partnershipSchema = z.object({
  name: z.string().trim().min(1, "Nama kemitraan wajib diisi"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

async function resolveLogoUrl(formData: FormData): Promise<string | undefined> {
  // Priority 1: pre-uploaded URL from client-side API upload
  const logoUrl = formData.get("logoUrl");
  if (logoUrl && typeof logoUrl === "string" && logoUrl.length > 0) {
    return logoUrl;
  }
  // Priority 2: direct file upload (legacy, kept as fallback)
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    return await uploadImage(file, "partnership");
  }
  return undefined; // no logo provided
}

export async function createPartnership(
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = partnershipSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let logo: string | undefined;
  try {
    logo = await resolveLogoUrl(formData);
  } catch {
    return { ok: false, error: "Gagal upload logo" };
  }

  try {
    await prisma.partnership.create({
      data: {
        name: parsed.data.name,
        status: (parsed.data.status as PartnershipStatus) ?? "ACTIVE",
        logo: logo ?? null,
      },
    });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Kemitraan sudah ada atau gagal dibuat" };
  }
}

export async function updatePartnership(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = partnershipSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const deleteLogo = formData.get("logo_delete") === "1";
  let logo: string | undefined | null; // undefined = no change, null = delete, string = replace

  if (deleteLogo) {
    const existing = await prisma.partnership.findUnique({ where: { id }, select: { logo: true } });
    if (existing?.logo) deleteImage(existing.logo);
    logo = null;
  } else {
    try {
      const resolved = await resolveLogoUrl(formData);
      if (resolved !== undefined) {
        const existing = await prisma.partnership.findUnique({ where: { id }, select: { logo: true } });
        if (existing?.logo) deleteImage(existing.logo);
        logo = resolved;
      }
    } catch {
      return { ok: false, error: "Gagal upload logo" };
    }
  }

  try {
    await prisma.partnership.update({
      where: { id },
      data: {
        name: parsed.data.name,
        status: (parsed.data.status as PartnershipStatus) ?? "ACTIVE",
        ...(logo !== undefined ? { logo: logo ?? null } : {}),
      },
    });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memperbarui kemitraan" };
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
      error: "Kemitraan masih memiliki outlet. Pindahkan atau hapus outlet dulu.",
    };
  }
  const p = await prisma.partnership.findUnique({ where: { id }, select: { logo: true } });
  try {
    await prisma.partnership.delete({ where: { id } });
    if (p?.logo) deleteImage(p.logo);
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus kemitraan" };
  }
}

const subPartnershipSchema = z.object({
  partnershipId: z.string().min(1, "Kemitraan wajib dipilih"),
  name: z.string().trim().min(1, "Nama sub kemitraan wajib diisi"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

const subPartnershipUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama sub kemitraan wajib diisi"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export async function createSubPartnership(
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = subPartnershipSchema.safeParse({
    partnershipId: formData.get("partnershipId"),
    name: formData.get("name"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let logo: string | undefined;
  try {
    logo = await resolveLogoUrl(formData);
  } catch {
    return { ok: false, error: "Gagal upload logo" };
  }

  try {
    await prisma.subPartnership.create({
      data: {
        partnershipId: parsed.data.partnershipId,
        name: parsed.data.name,
        status: (parsed.data.status as PartnershipStatus) ?? "ACTIVE",
        logo: logo ?? null,
      },
    });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sub kemitraan sudah ada atau gagal dibuat" };
  }
}

export async function updateSubPartnership(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = subPartnershipUpdateSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const deleteLogo = formData.get("logo_delete") === "1";
  let logo: string | undefined | null;

  if (deleteLogo) {
    const existing = await prisma.subPartnership.findUnique({ where: { id }, select: { logo: true } });
    if (existing?.logo) deleteImage(existing.logo);
    logo = null;
  } else {
    try {
      const resolved = await resolveLogoUrl(formData);
      if (resolved !== undefined) {
        const existing = await prisma.subPartnership.findUnique({ where: { id }, select: { logo: true } });
        if (existing?.logo) deleteImage(existing.logo);
        logo = resolved;
      }
    } catch {
      return { ok: false, error: "Gagal upload logo" };
    }
  }

  try {
    await prisma.subPartnership.update({
      where: { id },
      data: {
        name: parsed.data.name,
        status: (parsed.data.status as PartnershipStatus) ?? "ACTIVE",
        ...(logo !== undefined ? { logo: logo ?? null } : {}),
      },
    });
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memperbarui sub kemitraan" };
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
      error: "Sub kemitraan masih memiliki outlet. Pindahkan atau hapus outlet dulu.",
    };
  }
  const sp = await prisma.subPartnership.findUnique({ where: { id }, select: { logo: true } });
  try {
    await prisma.subPartnership.delete({ where: { id } });
    if (sp?.logo) deleteImage(sp.logo);
    revalidatePath("/kemitraan");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus sub kemitraan" };
  }
}
