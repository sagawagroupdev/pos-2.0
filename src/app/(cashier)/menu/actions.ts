"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { uploadImage, deleteImage } from "@/lib/r2";
import { invalidateMenuCache } from "@/lib/menu";

export type ActionResult = { ok: boolean; error?: string };

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi"),
});

export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.category.create({ data: { name: parsed.data.name } });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Kategori sudah ada atau gagal dibuat" };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memperbarui kategori" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireUser();
  const itemCount = await prisma.item.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    return { ok: false, error: "Kategori masih memiliki item. Hapus item dulu." };
  }
  try {
    await prisma.category.delete({ where: { id } });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus kategori" };
  }
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Nama item wajib diisi"),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, "Harga tidak valid"),
  stock: z.coerce.number().int().min(0, "Stok tidak valid"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
});

export async function createItem(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let imageUrl: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadImage(image);
    } catch {
      return { ok: false, error: "Gagal mengunggah gambar" };
    }
  }

  try {
    await prisma.item.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        stock: parsed.data.stock,
        categoryId: parsed.data.categoryId,
        image: imageUrl ?? null,
      },
    });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal membuat item" };
  }
}

export async function updateItem(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireUser();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Item tidak ditemukan" };

  let imageUrl = existing.image;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadImage(image);
      if (existing.image) await deleteImage(existing.image);
    } catch {
      return { ok: false, error: "Gagal mengunggah gambar" };
    }
  }

  try {
    await prisma.item.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        stock: parsed.data.stock,
        categoryId: parsed.data.categoryId,
        image: imageUrl,
      },
    });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memperbarui item" };
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  await requireUser();
  const orderItemCount = await prisma.orderItem.count({ where: { itemId: id } });
  if (orderItemCount > 0) {
    return {
      ok: false,
      error: "Item sudah pernah dipesan. Nonaktifkan saja agar riwayat tetap utuh.",
    };
  }
  const existing = await prisma.item.findUnique({ where: { id } });
  try {
    await prisma.item.delete({ where: { id } });
    if (existing?.image) await deleteImage(existing.image);
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal menghapus item" };
  }
}

export async function toggleItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<ActionResult> {
  await requireUser();
  try {
    await prisma.item.update({ where: { id }, data: { isAvailable } });
    await invalidateMenuCache();
    revalidatePath("/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "Gagal memperbarui ketersediaan" };
  }
}
