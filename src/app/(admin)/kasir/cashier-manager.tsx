"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { gooeyToast } from "gooey-toast";
import {
  createCashier,
  updateCashier,
  setCashierActive,
  resetCashierPassword,
  deleteCashier,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
} from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { EyeSlash, Eye } from "iconsax-react";
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

export type SubPartnershipOption = { id: string; name: string; logo: string | null };
export type PartnershipOption = {
  id: string;
  name: string;
  logo: string | null;
  subPartnerships: SubPartnershipOption[];
};

export type CashierRow = {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  createdAt: string;
  partnershipName: string | null;
  subPartnershipName: string | null;
  partnershipId: string | null;
  subPartnershipId: string | null;
  outletAddress: string | null;
  outletPhone: string | null;
  outletPic: string | null;
  outletFoundedDate: string | null;
};

// ---------- Form fields shared by create & edit ----------
function CashierFormFields({
  partnerships,
  selectedPartnership,
  onPartnershipChange,
  selectedSub,
  onSubChange,
  defaults,
  showPassword,
}: {
  partnerships: PartnershipOption[];
  selectedPartnership: string;
  onPartnershipChange: (v: string) => void;
  selectedSub: string;
  onSubChange: (v: string) => void;
  defaults?: CashierRow;
  showPassword: boolean;
}) {
  const subOptions =
    partnerships.find((p) => p.id === selectedPartnership)?.subPartnerships ?? [];
  const currentPartner = partnerships.find((p) => p.id === selectedPartnership);
  const logoUrl = selectedSub
    ? subOptions.find((s) => s.id === selectedSub)?.logo
    : currentPartner?.logo;

  const [pwVisible, setPwVisible] = useState(false);
  const dateStr = defaults?.outletFoundedDate?.split("T")[0] ?? "";
  const [dateOpen, setDateOpen] = useState(false);
  const [rawDate, setRawDate] = useState(dateStr);
  const parsedDate = rawDate ? parse(rawDate, "yyyy-MM-dd", new Date()) : undefined;
  const handleDateSelect = useCallback(
    (d: Date) => {
      setRawDate(format(d, "yyyy-MM-dd"));
      setDateOpen(false);
    },
    [],
  );

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Outlet *</Label>
        <Input id="name" name="name" defaultValue={defaults?.name ?? ""} placeholder="Nama outlet" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} placeholder="email@example.com" required />
      </div>
      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={pwVisible ? "text" : "password"}
              minLength={8}
              placeholder="Min 8 karakter"
              className="pr-9"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setPwVisible((p) => !p)}
            >
              {pwVisible ? <Eye size="18" color="currentColor" /> : <EyeSlash size="18" color="currentColor" />}
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="outletPhone">No Telp</Label>
          <Input id="outletPhone" name="outletPhone" defaultValue={defaults?.outletPhone ?? ""} placeholder="08xxx" />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Berdiri</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              render={
                <Button variant="outline" role="combobox" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 size-4 shrink-0" />
                  {parsedDate ? format(parsedDate, "dd MMMM yyyy", { locale: id }) : <span className="text-muted-foreground">Pilih tanggal</span>}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-3" align="start">
              <Calendar selected={parsedDate} onSelect={handleDateSelect} />
            </PopoverContent>
          </Popover>
          <input type="hidden" name="outletFoundedDate" value={rawDate} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="outletAddress">Alamat Outlet</Label>
        <Textarea id="outletAddress" name="outletAddress" defaultValue={defaults?.outletAddress ?? ""} placeholder="Alamat lengkap outlet" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outletPic">PIC</Label>
        <Input id="outletPic" name="outletPic" defaultValue={defaults?.outletPic ?? ""} placeholder="Nama PIC" />
      </div>
      <div className="space-y-2">
        <Label>Kemitraan</Label>
        <Combobox
          options={partnerships.map((p) => ({ label: p.name, value: p.id }))}
          value={selectedPartnership}
          onChange={(v) => {
            onPartnershipChange(v);
            onSubChange("");
          }}
          placeholder="Pilih kemitraan"
        />
      </div>
      {subOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Sub Kemitraan</Label>
          <Combobox
            options={subOptions.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSub}
            onChange={onSubChange}
            placeholder="Pilih sub kemitraan"
          />
        </div>
      )}
      {logoUrl && (
        <div className="space-y-2">
          <Label>Logo</Label>
          <Image src={logoUrl} alt="Logo" width={80} height={80} className="rounded-md object-cover" />
        </div>
      )}
    </div>
  );
}

// ---------- Main component ----------
export function CashierManager({
  cashiers,
  partnerships,
}: {
  cashiers: CashierRow[];
  partnerships: PartnershipOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CashierRow | null>(null);
  const [selectedPartnership, setSelectedPartnership] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [editPartnership, setEditPartnership] = useState("");
  const [editSub, setEditSub] = useState("");

  function resetForm() {
    setSelectedPartnership("");
    setSelectedSub("");
  }

  function handleCreate(formData: FormData) {
    if (!selectedPartnership) {
      gooeyToast.error({ title: "Kemitraan wajib dipilih" });
      return;
    }
    const subOptions =
      partnerships.find((p) => p.id === selectedPartnership)?.subPartnerships ?? [];
    if (subOptions.length > 0 && !selectedSub) {
      gooeyToast.error({ title: "Sub kemitraan wajib dipilih" });
      return;
    }
    formData.set("partnershipId", selectedPartnership);
    formData.set("subPartnershipId", subOptions.length > 0 ? selectedSub : "");
    startTransition(async () => {
      const res = await createCashier(formData);
      if (res.ok) {
        gooeyToast.info({ title: "Kasir berhasil dibuat" });
        setCreateOpen(false);
        resetForm();
      } else {
        gooeyToast.error({ title: res.error });
      }
    });
  }

  function handleEdit(formData: FormData) {
    if (!editTarget) return;
    if (!editPartnership) {
      gooeyToast.error({ title: "Kemitraan wajib dipilih" });
      return;
    }
    const subOptions =
      partnerships.find((p) => p.id === editPartnership)?.subPartnerships ?? [];
    if (subOptions.length > 0 && !editSub) {
      gooeyToast.error({ title: "Sub kemitraan wajib dipilih" });
      return;
    }
    formData.set("partnershipId", editPartnership);
    formData.set("subPartnershipId", subOptions.length > 0 ? editSub : "");
    startTransition(async () => {
      const res = await updateCashier(editTarget.id, formData);
      if (res.ok) {
        gooeyToast.info({ title: "Kasir diperbarui" });
        setEditTarget(null);
      } else {
        gooeyToast.error({ title: res.error });
      }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await setCashierActive(id, active);
      if (res.ok) gooeyToast.info({ title: active ? "Kasir diaktifkan" : "Kasir dinonaktifkan" });
      else gooeyToast.error({ title: res.error });
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus kasir ini secara permanen?")) return;
    startTransition(async () => {
      const res = await deleteCashier(id);
      if (res.ok) gooeyToast.info({ title: "Kasir dihapus" });
      else gooeyToast.error({ title: res.error });
    });
  }

  function handleResetPassword(id: string) {
    const pw = prompt("Password baru (min 8 karakter):");
    if (!pw) return;
    startTransition(async () => {
      const res = await resetCashierPassword(id, pw);
      if (res.ok) gooeyToast.info({ title: "Password direset" });
      else gooeyToast.error({ title: res.error });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manajemen Kasir</h1>
        <Sheet
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) resetForm();
          }}
        >
          <SheetTrigger render={<Button>Tambah Kasir</Button>} />
          <SheetContent className="w-full max-w-lg">
            <form action={handleCreate} className="flex h-full flex-col">
              <SheetHeader>
                <SheetTitle>Tambah Kasir</SheetTitle>
                <SheetDescription>
                  Buat akun kasir baru. Login menggunakan email & password.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4">
                <CashierFormFields
                  partnerships={partnerships}
                  selectedPartnership={selectedPartnership}
                  onPartnershipChange={setSelectedPartnership}
                  selectedSub={selectedSub}
                  onSubChange={setSelectedSub}
                  showPassword
                />
              </div>
              <div className="border-t px-4 py-3">
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Outlet</TableHead>
            <TableHead>Kemitraan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashiers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Belum ada kasir
              </TableCell>
            </TableRow>
          ) : (
            cashiers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  {c.partnershipName ? (
                    <span>
                      {c.partnershipName}
                      {c.subPartnershipName ? (
                        <span className="text-muted-foreground">
                          {" "}/ {c.subPartnershipName}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {c.banned ? (
                    <Badge variant="secondary">Nonaktif</Badge>
                  ) : (
                    <Badge>Aktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      setEditTarget(c);
                      setEditPartnership(c.partnershipId ?? "");
                      setEditSub(c.subPartnershipId ?? "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => handleToggle(c.id, c.banned)}
                  >
                    {c.banned ? "Aktifkan" : "Nonaktifkan"}
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

      {/* Edit sheet */}
      <Sheet open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <SheetContent className="w-full max-w-lg">
          <form action={handleEdit} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Edit Kasir</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <CashierFormFields
                partnerships={partnerships}
                selectedPartnership={editPartnership}
                onPartnershipChange={setEditPartnership}
                selectedSub={editSub}
                onSubChange={setEditSub}
                defaults={editTarget ?? undefined}
                showPassword={false}
              />
            </div>
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
