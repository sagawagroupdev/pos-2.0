"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Shop } from "iconsax-react";
import {
  createPartnership,
  updatePartnership,
  deletePartnership,
  createSubPartnership,
  updateSubPartnership,
  deleteSubPartnership,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadLogo } from "./_components/logo-field";
import { PartnershipFields, SubPartnershipFields } from "./_components/partnership-fields";
import { SubItem } from "./_components/sub-item";
import { statusLabel, statusVariant } from "./types";
import type { PartnershipRow, SubPartnershipRow, Status } from "./types";

// ---------- Main component ----------
export type { PartnershipRow, SubPartnershipRow };

export function KemitraanManager({
  partnerships,
}: {
  partnerships: PartnershipRow[];
}) {
  const [pending, startTransition] = useTransition();

  // Create Partnership
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<Status>("ACTIVE");
  const [createLogoFile, setCreateLogoFile] = useState<File | null>(null);

  // Edit Partnership
  const [editTarget, setEditTarget] = useState<PartnershipRow | null>(null);
  const [editStatus, setEditStatus] = useState<Status>("ACTIVE");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);

  // Create Sub
  const [subFor, setSubFor] = useState<PartnershipRow | null>(null);
  const [subCreateStatus, setSubCreateStatus] = useState<Status>("ACTIVE");
  const [subCreateLogoFile, setSubCreateLogoFile] = useState<File | null>(null);

  // Edit Sub
  const [subEditTarget, setSubEditTarget] = useState<SubPartnershipRow | null>(null);
  const [subEditStatus, setSubEditStatus] = useState<Status>("ACTIVE");
  const [subEditLogoFile, setSubEditLogoFile] = useState<File | null>(null);

  // ---------- Handlers ----------
  async function handleCreatePartnership(formData: FormData) {
    startTransition(async () => {
      try {
        if (createLogoFile) {
          const url = await uploadLogo(createLogoFile);
          if (!url) { toast.error("Gagal upload logo"); return; }
          formData.set("logoUrl", url);
        }
        const res = await createPartnership(formData);
        if (res.ok) {
          toast.success("Kemitraan dibuat");
          setCreateOpen(false);
          setCreateLogoFile(null);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  }

  async function handleUpdatePartnership(formData: FormData) {
    if (!editTarget) return;
    startTransition(async () => {
      try {
        if (editLogoFile) {
          const url = await uploadLogo(editLogoFile);
          if (!url) { toast.error("Gagal upload logo"); return; }
          formData.set("logoUrl", url);
        }
        const res = await updatePartnership(editTarget.id, formData);
        if (res.ok) {
          toast.success("Kemitraan diperbarui");
          setEditTarget(null);
          setEditLogoFile(null);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  }

  function handleDeletePartnership(id: string) {
    if (!confirm("Hapus kemitraan ini beserta semua sub-nya?")) return;
    startTransition(async () => {
      const res = await deletePartnership(id);
      if (res.ok) toast.success("Kemitraan dihapus");
      else toast.error(res.error ?? "Gagal");
    });
  }

  function handleDeleteSub(id: string) {
    if (!confirm("Hapus sub kemitraan ini?")) return;
    startTransition(async () => {
      const res = await deleteSubPartnership(id);
      if (res.ok) toast.success("Sub kemitraan dihapus");
      else toast.error(res.error ?? "Gagal");
    });
  }

  async function handleCreateSub(formData: FormData) {
    startTransition(async () => {
      try {
        if (subCreateLogoFile) {
          const url = await uploadLogo(subCreateLogoFile);
          if (!url) { toast.error("Gagal upload logo"); return; }
          formData.set("logoUrl", url);
        }
        const res = await createSubPartnership(formData);
        if (res.ok) {
          toast.success("Sub kemitraan dibuat");
          setSubFor(null);
          setSubCreateLogoFile(null);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  }

  async function handleUpdateSub(formData: FormData) {
    if (!subEditTarget) return;
    startTransition(async () => {
      try {
        if (subEditLogoFile) {
          const url = await uploadLogo(subEditLogoFile);
          if (!url) { toast.error("Gagal upload logo"); return; }
          formData.set("logoUrl", url);
        }
        const res = await updateSubPartnership(subEditTarget.id, formData);
        if (res.ok) {
          toast.success("Sub kemitraan diperbarui");
          setSubEditTarget(null);
          setSubEditLogoFile(null);
        } else {
          toast.error(res.error ?? "Gagal");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  }

  // ---------- Render ----------
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Kemitraan</h1>
        <Sheet
          open={createOpen}
          onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateLogoFile(null); }}
        >
          <SheetTrigger render={<Button>Tambah Kemitraan</Button>} />
          <SheetContent className="w-full max-w-lg">
            <form action={handleCreatePartnership} className="flex h-full flex-col">
              <SheetHeader>
                <SheetTitle>Tambah Kemitraan</SheetTitle>
                <SheetDescription>
                  Lengkapi data kemitraan. Sub kemitraan ditambahkan setelahnya.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 px-4">
                <PartnershipFields
                  formId="create"
                  status={createStatus}
                  onStatusChange={setCreateStatus}
                  onFileChange={setCreateLogoFile}
                />
              </ScrollArea>
              <div className="border-t px-4 py-3">
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Partnership list */}
      {partnerships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada kemitraan. Tambahkan kemitraan untuk mulai.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {partnerships.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                    {p.logo ? (
                      <Image src={p.logo} alt="" width={40} height={40} className="size-10 rounded object-cover" />
                    ) : (
                      <Shop size="20" color="currentColor" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      <Badge variant={statusVariant[p.status]}>
                        {statusLabel[p.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditTarget(p);
                      setEditStatus(p.status);
                      setEditLogoFile(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubFor(p);
                      setSubCreateStatus("ACTIVE");
                      setSubCreateLogoFile(null);
                    }}
                  >
                    Tambah Sub
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleDeletePartnership(p.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {p.subPartnerships.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada sub kemitraan.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {p.subPartnerships.map((s) => (
                      <SubItem
                        key={s.id}
                        sub={s}
                        pending={pending}
                        onEdit={(sub) => {
                          setSubEditTarget(sub);
                          setSubEditStatus(sub.status);
                          setSubEditLogoFile(null);
                        }}
                        onDelete={handleDeleteSub}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Partnership sheet */}
      <Sheet
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) { setEditTarget(null); setEditLogoFile(null); } }}
      >
        <SheetContent className="w-full max-w-lg m-1">
          <form action={handleUpdatePartnership} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Edit Kemitraan</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              {editTarget && (
                <PartnershipFields
                  formId="edit"
                  defaults={editTarget}
                  status={editStatus}
                  onStatusChange={setEditStatus}
                  onFileChange={setEditLogoFile}
                />
              )}
            </ScrollArea>
            <div className="border-t px-4 py-3">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Create Sub sheet */}
      <Sheet
        open={!!subFor}
        onOpenChange={(o) => { if (!o) { setSubFor(null); setSubCreateLogoFile(null); } }}
      >
        <SheetContent className="w-full max-w-lg">
          <form action={handleCreateSub} className="flex h-full flex-col">
            <input type="hidden" name="partnershipId" value={subFor?.id ?? ""} />
            <SheetHeader>
              <SheetTitle>Tambah Sub Kemitraan</SheetTitle>
              <SheetDescription>Sub brand untuk {subFor?.name}.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              <SubPartnershipFields
                formId="sub-create"
                status={subCreateStatus}
                onStatusChange={setSubCreateStatus}
                onFileChange={setSubCreateLogoFile}
              />
            </ScrollArea>
            <div className="border-t px-4 py-3">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Sub sheet */}
      <Sheet
        open={!!subEditTarget}
        onOpenChange={(o) => { if (!o) { setSubEditTarget(null); setSubEditLogoFile(null); } }}
      >
        <SheetContent className="w-full max-w-lg">
          <form action={handleUpdateSub} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Edit Sub Kemitraan</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              {subEditTarget && (
                <SubPartnershipFields
                  formId="sub-edit"
                  defaults={subEditTarget}
                  status={subEditStatus}
                  onStatusChange={setSubEditStatus}
                  onFileChange={setSubEditLogoFile}
                />
              )}
            </ScrollArea>
            <div className="border-t px-4 py-3">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
