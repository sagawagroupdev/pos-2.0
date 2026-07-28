"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  createOutlet,
  updateOutlet,
  setOutletActive,
  resetOutletPassword,
  deleteOutlet,
} from "./actions";
import { OutletFormFields } from "./_components/outlet-form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, Search01Icon } from "@hugeicons/core-free-icons";

export type SubPartnershipOption = { id: string; name: string; logo: string | null };
export type PartnershipOption = {
  id: string;
  name: string;
  logo: string | null;
  subPartnerships: SubPartnershipOption[];
};

export type OutletRow = {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  createdAt: string;
  partnershipName: string | null;
  subPartnershipName: string | null;
  partnershipId: string | null;
  subPartnershipId: string | null;
  partnershipLogo: string | null;
  outletAddress: string | null;
  outletPhone: string | null;
  outletLogo: string | null;
  outletPic: string | null;
  outletFoundedDate: string | null;
};

// ---------- Main component ----------
export function OutletManager({
  outlets,
  partnerships,
}: {
  outlets: OutletRow[];
  partnerships: PartnershipOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OutletRow | null>(null);
  const [selectedPartnership, setSelectedPartnership] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [editPartnership, setEditPartnership] = useState("");
  const [editSub, setEditSub] = useState("");
  const [search, setSearch] = useState("");
  const [resetPwTarget, setResetPwTarget] = useState<string | null>(null);

  const filtered = search
    ? outlets.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : outlets;

  function resetForm() {
    setSelectedPartnership("");
    setSelectedSub("");
  }

  function handleCreate(formData: FormData) {
    if (!selectedPartnership) {
      toast.error("Kemitraan wajib dipilih");
      return;
    }
    const subOptions =
      partnerships.find((p) => p.id === selectedPartnership)?.subPartnerships ?? [];
    if (subOptions.length > 0 && !selectedSub) {
      toast.error("Sub kemitraan wajib dipilih");
      return;
    }
    formData.set("partnershipId", selectedPartnership);
    formData.set("subPartnershipId", subOptions.length > 0 ? selectedSub : "");
    startTransition(async () => {
      const res = await createOutlet(formData);
      if (res.ok) {
        toast.success("Outlet berhasil dibuat");
        setCreateOpen(false);
        resetForm();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleEdit(formData: FormData) {
    if (!editTarget) return;
    if (!editPartnership) {
      toast.error("Kemitraan wajib dipilih");
      return;
    }
    const subOptions =
      partnerships.find((p) => p.id === editPartnership)?.subPartnerships ?? [];
    if (subOptions.length > 0 && !editSub) {
      toast.error("Sub kemitraan wajib dipilih");
      return;
    }
    formData.set("partnershipId", editPartnership);
    formData.set("subPartnershipId", subOptions.length > 0 ? editSub : "");
    startTransition(async () => {
      const res = await updateOutlet(editTarget.id, formData);
      if (res.ok) {
        toast.success("Outlet diperbarui");
        setEditTarget(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await setOutletActive(id, active);
      if (res.ok) toast.success(active ? "Outlet diaktifkan" : "Outlet dinonaktifkan");
      else toast.error(res.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus outlet ini secara permanen?")) return;
    startTransition(async () => {
      const res = await deleteOutlet(id);
      if (res.ok) toast.success("Outlet dihapus");
      else toast.error(res.error);
    });
  }

  function handleResetPassword(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = fd.get("password") as string;
    if (!pw || pw.length < 8) { toast.error("Minimal 8 karakter"); return; }
    startTransition(async () => {
      const res = await resetOutletPassword(resetPwTarget!, pw);
      if (res.ok) { toast.success("Password direset"); setResetPwTarget(null); }
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search + Tambah */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} color="currentColor" strokeWidth={1.5} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari outlet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full max-w-xs rounded-lg pl-8"
          />
        </div>
        <Sheet
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) resetForm();
          }}
        >
          <SheetTrigger render={<Button>Tambah Outlet</Button>} />
          <SheetContent className="w-full max-w-lg">
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(new FormData(e.currentTarget)); }} className="flex h-full flex-col">
              <SheetHeader>
                <SheetTitle>Tambah Outlet</SheetTitle>
                <SheetDescription>
                  Buat akun outlet baru. Login menggunakan email & password.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 px-4">
                <OutletFormFields
                  partnerships={partnerships}
                  selectedPartnership={selectedPartnership}
                  onPartnershipChange={setSelectedPartnership}
                  selectedSub={selectedSub}
                  onSubChange={setSelectedSub}
                  showPassword
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Nama Outlet</TableHead>
              <TableHead>Kemitraan</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {search ? "Tidak ditemukan" : "Belum ada outlet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {c.partnershipLogo ? (
                        <Image
                          src={c.partnershipLogo}
                          alt=""
                          width={28}
                          height={28}
                          className="size-7 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-7 shrink-0 rounded-full bg-muted" />
                      )}
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="leading-tight">{c.partnershipName ?? <span className="text-muted-foreground">-</span>}</div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {c.subPartnershipName ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.outletPhone ?? "-"}</div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {c.outletAddress ?? "-"}
                  </TableCell>
                  <TableCell>
                    {c.banned ? (
                      <Badge variant="warning">Nonaktif</Badge>
                    ) : (
                      <Badge variant="success">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-xs">
                            <HugeiconsIcon icon={MoreHorizontalIcon} color="currentColor" strokeWidth={1.5} className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="min-w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTarget(c);
                            setEditPartnership(c.partnershipId ?? "");
                            setEditSub(c.subPartnershipId ?? "");
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setResetPwTarget(c.id)}
                        >
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle(c.id, c.banned)}
                        >
                          {c.banned ? "Aktifkan" : "Nonaktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit sheet */}
      <Sheet open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <SheetContent className="w-full max-w-lg">
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(new FormData(e.currentTarget)); }} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Edit Outlet</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-4">
              <OutletFormFields
                partnerships={partnerships}
                selectedPartnership={editPartnership}
                onPartnershipChange={setEditPartnership}
                selectedSub={editSub}
                onSubChange={setEditSub}
                defaults={editTarget ?? undefined}
                showPassword={false}
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

      {/* Reset Password dialog */}
      <Dialog open={!!resetPwTarget} onOpenChange={(o) => { if (!o) setResetPwTarget(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Masukkan password baru untuk outlet ini (min 8 karakter).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <Input
              name="password"
              type="password"
              placeholder="Password baru"
              minLength={8}
              required
              autoFocus
            />
            <DialogFooter className="mt-4">
              <DialogClose render={<Button variant="outline" type="button" />}>
                Batal
              </DialogClose>
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
