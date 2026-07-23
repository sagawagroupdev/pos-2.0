"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type CategoryRow = { id: string; name: string; itemCount: number };

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createCategory(formData);
      if (res.ok) {
        toast.success("Kategori dibuat");
        setCreateOpen(false);
      } else toast.error(res.error);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateCategory(editing.id, formData);
      if (res.ok) {
        toast.success("Kategori diperbarui");
        setEditing(null);
      } else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteCategory(deleteTarget.id);
      if (res.ok) toast.success("Kategori dihapus");
      else toast.error(res.error);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
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

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Jumlah Menu</TableHead>
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
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.itemCount}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <HugeiconsIcon icon={Edit02Icon} size={16} color="currentColor" />
                    </Button>
                    <AlertDialog
                      open={deleteTarget?.id === c.id}
                      onOpenChange={(o) => !o && setDeleteTarget(null)}
                    >
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => setDeleteTarget(c)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                          <AlertDialogDescription>
                            Yakin ingin menghapus kategori <strong>{deleteTarget?.name}</strong>?
                            {deleteTarget && deleteTarget.itemCount > 0 && (
                              <span className="block mt-2 text-destructive">
                                Kategori ini memiliki {deleteTarget.itemCount} item. Hapus item terlebih dahulu.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel render={<Button variant="outline">Batal</Button>} />
                          <AlertDialogAction
                            render={
                              <Button
                                variant="destructive"
                                disabled={pending || (deleteTarget?.itemCount ?? 0) > 0}
                                onClick={confirmDelete}
                              >
                                {pending ? "Menghapus..." : "Hapus"}
                              </Button>
                            }
                          />
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
