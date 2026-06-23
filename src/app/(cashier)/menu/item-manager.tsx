"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  createItem,
  updateItem,
  deleteItem,
  toggleItemAvailability,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
};

export type CategoryOption = { id: string; name: string };

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function ItemFormFields({
  item,
  categories,
}: {
  item?: ItemRow;
  categories: CategoryOption[];
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" defaultValue={item?.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Input
          id="description"
          name="description"
          defaultValue={item?.description ?? ""}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="price">Harga</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={item?.price}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="stock">Stok</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={item?.stock ?? 0}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">Kategori</Label>
        <Select name="categoryId" defaultValue={item?.categoryId}>
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="image">Gambar</Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
    </div>
  );
}

export function ItemManager({
  items,
  categories,
}: {
  items: ItemRow[];
  categories: CategoryOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ItemRow | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createItem(formData);
      if (res.ok) {
        toast.success("Item dibuat");
        setCreateOpen(false);
      } else toast.error(res.error);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateItem(editing.id, formData);
      if (res.ok) {
        toast.success("Item diperbarui");
        setEditing(null);
      } else toast.error(res.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) return;
    startTransition(async () => {
      const res = await deleteItem(id);
      if (res.ok) toast.success("Item dihapus");
      else toast.error(res.error);
    });
  }

  function handleToggle(id: string, available: boolean) {
    startTransition(async () => {
      const res = await toggleItemAvailability(id, available);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Item Menu</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button size="sm" disabled={categories.length === 0}>
                Tambah Item
              </Button>
            }
          />
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Item</DialogTitle>
                <DialogDescription>
                  Lengkapi detail item menu.
                </DialogDescription>
              </DialogHeader>
              <ItemFormFields categories={categories} />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Buat kategori terlebih dahulu sebelum menambah item.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gambar</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Belum ada item
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="size-10 rounded object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>{rupiah(item.price)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  {item.isAvailable ? (
                    <Badge>Tersedia</Badge>
                  ) : (
                    <Badge variant="secondary">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => handleToggle(item.id, !item.isAvailable)}
                  >
                    {item.isAvailable ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleDelete(item.id)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Kosongkan gambar jika tidak ingin mengubahnya.
              </DialogDescription>
            </DialogHeader>
            {editing && (
              <ItemFormFields item={editing} categories={categories} />
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
