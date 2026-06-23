"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { createTable, deleteTable } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type TableRow = {
  id: string;
  number: string;
  name: string | null;
  orderUrl: string;
  qrDataUrl: string;
};

function PrintableQr({
  table,
  printRef,
}: {
  table: TableRow;
  printRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="hidden">
      <div ref={printRef} className="flex flex-col items-center gap-3 p-8">
        <h2 className="text-xl font-bold">Meja {table.number}</h2>
        {table.name && <p>{table.name}</p>}
        <Image
          src={table.qrDataUrl}
          alt={`QR Meja ${table.number}`}
          width={280}
          height={280}
        />
        <p className="text-sm">Scan untuk memesan</p>
      </div>
    </div>
  );
}

function TableCard({ table }: { table: TableRow }) {
  const [pending, startTransition] = useTransition();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  function handleDelete() {
    if (!confirm(`Hapus meja ${table.number}?`)) return;
    startTransition(async () => {
      const res = await deleteTable(table.id);
      if (res.ok) toast.success("Meja dihapus");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 pt-6">
        <span className="font-semibold">Meja {table.number}</span>
        {table.name && (
          <span className="text-sm text-muted-foreground">{table.name}</span>
        )}
        <Image
          src={table.qrDataUrl}
          alt={`QR Meja ${table.number}`}
          width={160}
          height={160}
          className="size-40"
        />
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => handlePrint()}>
          Cetak
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={handleDelete}
        >
          Hapus
        </Button>
      </CardFooter>
      <PrintableQr table={table} printRef={printRef} />
    </Card>
  );
}

export function QrTableManager({ tables }: { tables: TableRow[] }) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createTable(formData);
      if (res.ok) {
        toast.success("Meja dibuat");
        setCreateOpen(false);
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button>Tambah Meja</Button>} />
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Tambah Meja</DialogTitle>
                <DialogDescription>
                  QR Code unik akan dibuat otomatis untuk meja ini.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="number">Nomor Meja</Label>
                  <Input id="number" name="number" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nama / Keterangan (opsional)</Label>
                  <Input id="name" name="name" />
                </div>
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

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada meja. Tambahkan meja untuk menghasilkan QR Code.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <TableCard key={t.id} table={t} />
          ))}
        </div>
      )}
    </div>
  );
}
