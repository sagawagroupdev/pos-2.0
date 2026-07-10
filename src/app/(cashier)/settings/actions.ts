"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { uploadImage, deleteImage } from "@/lib/r2";

export type ActionResult = { ok: boolean; error?: string };

const settingsSchema = z.object({
  taxRate: z.coerce.number().min(0).max(100, "Tarif pajak tidak valid"),
  taxEnabled: z.boolean(),
  enableDraftOrders: z.boolean(),
  receiptFooter: z.string().trim().optional(),
  printerName: z.string().trim().optional(),
  paperSize: z.string().trim().optional(),
});

const outletSchema = z.object({
  outletName: z.string().trim().min(1, "Nama outlet wajib diisi"),
  outletAddress: z.string().trim().optional(),
  outletPhone: z.string().trim().optional(),
});

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const parsed = settingsSchema.safeParse({
    taxRate: formData.get("taxRate"),
    taxEnabled: formData.get("taxEnabled") === "on",
    enableDraftOrders: formData.get("enableDraftOrders") === "on",
    receiptFooter: formData.get("receiptFooter"),
    printerName: formData.get("printerName"),
    paperSize: formData.get("paperSize"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const current = await getSettings();

  let qrisImageUrl = current.qrisImageUrl;
  const qris = formData.get("qrisImage");
  if (qris instanceof File && qris.size > 0) {
    try {
      qrisImageUrl = await uploadImage(qris, "qris");
      if (current.qrisImageUrl) await deleteImage(current.qrisImageUrl);
    } catch {
      return { ok: false, error: "Gagal mengunggah gambar QRIS" };
    }
  }

  await prisma.setting.update({
    where: { id: current.id },
    data: {
      taxRate: parsed.data.taxRate,
      taxEnabled: parsed.data.taxEnabled,
      enableDraftOrders: parsed.data.enableDraftOrders,
      receiptFooter: parsed.data.receiptFooter || null,
      printerName: parsed.data.printerName || null,
      paperSize: parsed.data.paperSize || "58mm",
      qrisImageUrl,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateOutletInfo(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = outletSchema.safeParse({
    outletName: formData.get("outletName"),
    outletAddress: formData.get("outletAddress"),
    outletPhone: formData.get("outletPhone"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let outletLogo: string | undefined;
  const logo = formData.get("outletLogo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { outletLogo: true },
      });
      outletLogo = await uploadImage(logo, "outlet-logo");
      if (current?.outletLogo) await deleteImage(current.outletLogo);
    } catch {
      return { ok: false, error: "Gagal mengunggah logo" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.outletName,
      outletAddress: parsed.data.outletAddress || null,
      outletPhone: parsed.data.outletPhone || null,
      ...(outletLogo !== undefined ? { outletLogo } : {}),
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}
