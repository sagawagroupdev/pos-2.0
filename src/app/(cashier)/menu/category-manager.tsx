"use client";

import { useState, useTransition } from "react";
import { gooeyToast } from "gooey-toast";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type CategoryRow = { id: string; name: string; itemCount: number };

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createCategory(formData);
      if (res.ok) {
        gooeyToast.info({ title: "Kategori dibuat" });
        setCreateOpen(false);
      } else gooeyToast.error({ title: res.error });
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateCategory(editing.id, formData);
      if (res.ok) {
        gooeyToast.info({ title: "Kategori diperbarui" });
        setEditing(null);
      } else gooeyToast.error({ title: res.error });
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.ok) gooeyToast.info({ title: "Kategori dihapus" });
      else gooeyToast.error({ title: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kategori</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm">Tambah Kategori</Button>} />
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Kategori</DialogTitle>
                <DialogDescription>
                  Misal: Makanan, Minuman, Dessert.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Label htmlFor="cat-name">Nama</Label>
                <Input id="cat-name" name="name" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Jumlah Item</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Belum ada kategori
              </TableCell>
            </TableRow>
          ) : (
            categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.itemCount}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleDelete(c.id)}
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
              <DialogTitle>Edit Kategori</DialogTitle>
              <DialogDescription>Ubah nama kategori.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="edit-cat-name">Nama</Label>
              <Input
                id="edit-cat-name"
                name="name"
                defaultValue={editing?.name}
                required
              />
            </div>
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
