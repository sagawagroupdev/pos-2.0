"use client";

import { useState, useTransition, useMemo, useEffect, useRef, useCallback, useSyncExternalStore, type DragEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete02Icon,
  Search01Icon,
  ImageAdd01Icon,
} from "@hugeicons/core-free-icons";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
import {
  createItem,
  updateItem,
  deleteItem,
  toggleItemAvailability,
} from "./actions";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { rupiah } from "@/lib/format";

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

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function ItemFormFields({
  item,
  categories,
  categoryId,
  onCategoryChange,
  uploading,
}: {
  item?: ItemRow;
  categories: CategoryOption[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  uploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    item?.image ?? null
  );
  const [removed, setRemoved] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);

  // Reset preview when item changes (edit mode)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(item?.image ?? null);
    setRemoved(false);
    setFileSizeError(null);
  }, [item?.image]);

  function validateFile(file: File): boolean {
    if (file.size > MAX_IMAGE_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSizeError(`Ukuran file ${mb}MB melebihi batas maksimal 2MB`);
      setTimeout(() => setFileSizeError(null), 5000);
      return false;
    }
    return true;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) {
        e.target.value = "";
        return;
      }
      setPreview(URL.createObjectURL(file));
      setRemoved(false);
    }
  }

  function handleRemoveImage() {
    setPreview(null);
    setRemoved(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  const showImage = preview && !removed;
  const hasExisting = !!item?.image;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item?.name}
          placeholder="Contoh: Nasi Goreng Spesial"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Deskripsi menu…"
          rows={3}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="price">Harga</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="numeric"
            placeholder="0"
            defaultValue={item?.price ? item.price.toString() : ""}
            required
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              e.target.value = raw
                ? new Intl.NumberFormat("id-ID").format(Number(raw))
                : "";
            }}
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
            placeholder="0"
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">Kategori</Label>
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={(v) => onCategoryChange(v ?? "")}
          items={Object.fromEntries(categories.map(c => [c.id, c.name]))}
        >
          <SelectTrigger id="categoryId">
            <SelectValue placeholder="Pilih Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} label={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Gambar Menu</Label>
        {showImage ? (
          <div className="relative">
            <Image
              src={preview!}
              alt="Preview"
              width={200}
              height={200}
              className="w-full h-48 rounded-lg border border-border object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <span className="text-sm font-medium text-white">Mengunggah…</span>
              </div>
            )}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="absolute top-2 right-2 size-8 rounded-full"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={16}
                color="currentColor"
              />
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).dataset.dragover = "true";
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).dataset.dragover = "true";
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).dataset.dragover = "false";
            }}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).dataset.dragover = "false";
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) {
                if (!validateFile(file)) return;
                setPreview(URL.createObjectURL(file));
                setRemoved(false);
                const dt = new DataTransfer();
                dt.items.add(file);
                if (fileRef.current) fileRef.current.files = dt.files;
              }
            }}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-7 transition-colors data-[dragover=true]:border-primary data-[dragover=true]:bg-primary/5"
          >
            <HugeiconsIcon icon={ImageAdd01Icon} size={24} color="currentColor" className="text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              Klik untuk upload
            </p>
            <p className="text-xs text-muted-foreground/50">
              atau tarik dan lepas gambar di sini
            </p>
            <p className="text-xs text-muted-foreground/40 mt-0.5">
              PNG, JPG atau WEBP
            </p>
            <p className="text-[11px] text-muted-foreground/30 mt-0.5">
              Maks 2MB
            </p>
          </div>
        )}
        {fileSizeError && (
          <p className="text-xs text-destructive mt-1">{fileSizeError}</p>
        )}
        <input
          ref={fileRef}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {removed && hasExisting && (
          <input type="hidden" name="image_removed" value="true" />
        )}
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
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (editing) setEditCategoryId(editing.categoryId);
  }, [editing]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        rupiah(item.price).includes(q)
      );
    });
  }, [items, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginatedItems = filtered.slice((page - 1) * perPage, page * perPage);
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, filtered.length);

  // Reset page when search/filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, categoryFilter]);

  function handleCreate(formData: FormData) {
    const raw = String(formData.get("price") ?? "").replace(/\D/g, "");
    formData.set("price", raw);
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
    const raw = String(formData.get("price") ?? "").replace(/\D/g, "");
    formData.set("price", raw);
    startTransition(async () => {
      const res = await updateItem(editing.id, formData);
      if (res.ok) {
        toast.success("Item diperbarui");
        setEditing(null);
      } else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteItem(deleteTarget.id);
      if (res.ok) toast.success("Item dihapus");
      else toast.error(res.error);
      setDeleteTarget(null);
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
      <div className="flex justify-end">
        <Drawer
          open={createOpen}
          swipeDirection={isDesktop ? "right" : "down"}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) setCreateCategoryId("");
          }}
        >
          <Button
            size="default"
            variant="default"
            disabled={categories.length === 0}
            onClick={() => setCreateOpen(true)}
          >
            Tambah Menu
          </Button>
          <DrawerContent>
            <form action={handleCreate} className="flex flex-1 flex-col">
              <DrawerHeader>
                <DrawerTitle>Tambah Menu</DrawerTitle>
                <DrawerDescription>
                  Lengkapi detail item menu.
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4">
                <ItemFormFields
                  categories={categories}
                  categoryId={createCategoryId}
                  onCategoryChange={setCreateCategoryId}
                  uploading={pending}
                />
              </div>
              <DrawerFooter>
                <Button type="submit" loading={pending}>
                  Simpan
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Buat kategori terlebih dahulu sebelum menambah item.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Cari menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-8 h-9"
              />
            </div>
            <ButtonGroup className="flex-wrap">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
              >
                Semua
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={categoryFilter === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
          >
            {items.length} item
          </Badge>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
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
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground h-24"
                >
                  {items.length === 0
                    ? "Belum ada item"
                    : "Tidak ada item yang cocok"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
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
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{rupiah(item.price)}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={(checked) =>
                          handleToggle(item.id, checked)
                        }
                        disabled={pending}
                      />
                      {item.isAvailable ? (
                        <Badge className="border border-emerald-500 bg-emerald-100/50 text-xs text-emerald-500">
                          Tersedia
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="border border-rose-500 bg-rose-100/50 text-xs text-rose-500"
                        >
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditing(item)}
                            >
                              <HugeiconsIcon
                                icon={Edit02Icon}
                                size={16}
                                color="currentColor"
                              />
                            </Button>
                          }
                        />
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              size="icon"
                              variant="destructive"
                              disabled={pending}
                              onClick={() => setDeleteTarget(item)}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                size={16}
                                color="currentColor"
                              />
                            </Button>
                          }
                        />
                        <TooltipContent>Hapus</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {totalPages > 1 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {first}-{last} dari {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Sebelumnya
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - page) <= 1
                        )
                        .map((p, _idx, arr) => (
                          <span key={p} className="flex items-center gap-0.5">
                            {_idx > 0 && arr[_idx - 1] !== p - 1 && (
                              <span className="px-0.5 text-sm text-muted-foreground">
                                …
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant={p === page ? "default" : "ghost"}
                              onClick={() => setPage(p)}
                              className="min-w-8"
                            >
                              {p}
                            </Button>
                          </span>
                        ))}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline">Batal</Button>} />
            <AlertDialogAction
              render={
                <Button
                  variant="destructive"
                  loading={pending}
                  onClick={confirmDelete}
                >
                  Hapus
                </Button>
              }
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Drawer */}
      <Drawer
        open={!!editing}
        swipeDirection={isDesktop ? "right" : "down"}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DrawerContent>
          <form action={handleUpdate} className="flex flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle>Edit Item</DrawerTitle>
              <DrawerDescription>
                Kosongkan gambar jika tidak ingin mengubahnya.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
              {editing && (
                <ItemFormFields
                  item={editing}
                  categories={categories}
                  categoryId={editCategoryId}
                  onCategoryChange={setEditCategoryId}
                  uploading={pending}
                />
              )}
            </div>
            <DrawerFooter>
              <Button type="submit" loading={pending}>
                Simpan
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
