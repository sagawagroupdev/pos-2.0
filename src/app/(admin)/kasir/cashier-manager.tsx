"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCashier,
  setCashierActive,
  resetCashierPassword,
  deleteCashier,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export type SubPartnershipOption = { id: string; name: string };
export type PartnershipOption = {
  id: string;
  name: string;
  subPartnerships: SubPartnershipOption[];
};

export type CashierRow = {
  id: string;
  username: string | null;
  banned: boolean;
  createdAt: string;
  partnershipName: string | null;
  subPartnershipName: string | null;
};

export function CashierManager({
  cashiers,
  partnerships,
}: {
  cashiers: CashierRow[];
  partnerships: PartnershipOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  const subOptions =
    partnerships.find((p) => p.id === selectedPartnership)?.subPartnerships ?? [];

  function resetForm() {
    setSelectedPartnership("");
    setSelectedSub("");
  }

  function handleCreate(formData: FormData) {
    if (!selectedPartnership) {
      toast.error("Kemitraan wajib dipilih");
      return;
    }
    if (subOptions.length > 0 && !selectedSub) {
      toast.error("Sub kemitraan wajib dipilih");
      return;
    }
    formData.set("partnershipId", selectedPartnership);
    formData.set("subPartnershipId", subOptions.length > 0 ? selectedSub : "");
    startTransition(async () => {
      const res = await createCashier(formData);
      if (res.ok) {
        toast.success("Kasir berhasil dibuat");
        setCreateOpen(false);
        resetForm();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await setCashierActive(id, active);
      if (res.ok) toast.success(active ? "Kasir diaktifkan" : "Kasir dinonaktifkan");
      else toast.error(res.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus kasir ini secara permanen?")) return;
    startTransition(async () => {
      const res = await deleteCashier(id);
      if (res.ok) toast.success("Kasir dihapus");
      else toast.error(res.error);
    });
  }

  function handleResetPassword(id: string) {
    const pw = prompt("Password baru (min 8 karakter):");
    if (!pw) return;
    startTransition(async () => {
      const res = await resetCashierPassword(id, pw);
      if (res.ok) toast.success("Password direset");
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manajemen Kasir</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button>Tambah Kasir</Button>} />
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Kasir</DialogTitle>
                <DialogDescription>
                  Buat akun kasir baru. Login menggunakan username & password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kemitraan</Label>
                  <Select
                    value={selectedPartnership}
                    onValueChange={(v) => {
                      setSelectedPartnership(v ?? "");
                      setSelectedSub("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kemitraan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {partnerships.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {subOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub Kemitraan</Label>
                    <Select
                      value={selectedSub}
                      onValueChange={(v) => setSelectedSub(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sub kemitraan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {subOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
            <TableHead>Username</TableHead>
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
                <TableCell>{c.username ?? "-"}</TableCell>
                <TableCell>
                  {c.partnershipName ? (
                    <span>
                      {c.partnershipName}
                      {c.subPartnershipName ? (
                        <span className="text-muted-foreground">
                          {" "}
                          / {c.subPartnershipName}
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
                    onClick={() => handleToggle(c.id, c.banned)}
                  >
                    {c.banned ? "Aktifkan" : "Nonaktifkan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => handleResetPassword(c.id)}
                  >
                    Reset Password
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
    </div>
  );
}
