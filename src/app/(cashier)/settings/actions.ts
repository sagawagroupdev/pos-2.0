"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { uploadImage, deleteImage } from "@/lib/r2";

export type ActionResult = { ok: boolean; error?: string };

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Nama toko wajib diisi"),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  taxRate: z.coerce.number().min(0).max(100, "Tarif pajak tidak valid"),
  taxEnabled: z.boolean(),
  receiptFooter: z.string().trim().optional(),
  printerName: z.string().trim().optional(),
  paperSize: z.string().trim().optional(),
});

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    taxRate: formData.get("taxRate"),
    taxEnabled: formData.get("taxEnabled") === "on",
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

  let logoUrl = current.logoUrl;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await uploadImage(logo, "logo");
      if (current.logoUrl) await deleteImage(current.logoUrl);
    } catch {
      return { ok: false, error: "Gagal mengunggah logo" };
    }
  }

  await prisma.setting.update({
    where: { id: current.id },
    data: {
      storeName: parsed.data.storeName,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      taxRate: parsed.data.taxRate,
      taxEnabled: parsed.data.taxEnabled,
      receiptFooter: parsed.data.receiptFooter || null,
      printerName: parsed.data.printerName || null,
      paperSize: parsed.data.paperSize || "58mm",
      qrisImageUrl,
      logoUrl,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}
