"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPartnership,
  deletePartnership,
  createSubPartnership,
  deleteSubPartnership,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type SubPartnershipRow = { id: string; name: string };
export type PartnershipRow = {
  id: string;
  name: string;
  subPartnerships: SubPartnershipRow[];
};

export function KemitraanManager({
  partnerships,
}: {
  partnerships: PartnershipRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [subFor, setSubFor] = useState<PartnershipRow | null>(null);

  function handleCreatePartnership(formData: FormData) {
    startTransition(async () => {
      const res = await createPartnership(formData);
      if (res.ok) {
        toast.success("Kemitraan dibuat");
        setCreateOpen(false);
      } else toast.error(res.error);
    });
  }

  function handleDeletePartnership(id: string) {
    if (!confirm("Hapus kemitraan ini beserta semua sub-nya?")) return;
    startTransition(async () => {
      const res = await deletePartnership(id);
      if (res.ok) toast.success("Kemitraan dihapus");
      else toast.error(res.error);
    });
  }

  function handleCreateSub(formData: FormData) {
    startTransition(async () => {
      const res = await createSubPartnership(formData);
      if (res.ok) {
        toast.success("Sub kemitraan dibuat");
        setSubFor(null);
      } else toast.error(res.error);
    });
  }

  function handleDeleteSub(id: string) {
    if (!confirm("Hapus sub kemitraan ini?")) return;
    startTransition(async () => {
      const res = await deleteSubPartnership(id);
      if (res.ok) toast.success("Sub kemitraan dihapus");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kemitraan</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button>Tambah Kemitraan</Button>} />
          <DialogContent>
            <form action={handleCreatePartnership}>
              <DialogHeader>
                <DialogTitle>Tambah Kemitraan</DialogTitle>
                <DialogDescription>
                  Mis. RM Nusantara. Sub brand ditambahkan setelahnya.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Label htmlFor="name">Nama Kemitraan</Label>
                <Input id="name" name="name" required />
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

      {partnerships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada kemitraan. Tambahkan kemitraan untuk mulai.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {partnerships.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubFor(p)}
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
                  <p className="text-sm text-muted-foreground">
                    Belum ada sub kemitraan.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {p.subPartnerships.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <span>{s.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleDeleteSub(s.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!subFor} onOpenChange={(o) => !o && setSubFor(null)}>
        <DialogContent>
          <form action={handleCreateSub}>
            <input type="hidden" name="partnershipId" value={subFor?.id ?? ""} />
            <DialogHeader>
              <DialogTitle>Tambah Sub Kemitraan</DialogTitle>
              <DialogDescription>
                Sub brand untuk {subFor?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="sub-name">Nama Sub Kemitraan</Label>
              <Input id="sub-name" name="name" required />
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
