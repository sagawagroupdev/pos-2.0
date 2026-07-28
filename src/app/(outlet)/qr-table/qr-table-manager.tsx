"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createTable, deleteTable } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Download04Icon, Menu09Icon, Search01Icon, PlusSignIcon, Delete03Icon} from "@hugeicons/core-free-icons";

export type TableRow = {
  id: string;
  number: string;
  name: string | null;
  orderUrl: string;
  qrDataUrl: string;
};

function downloadQrImage(table: TableRow) {
  const W = 400;
  const QR_SIZE = 320;
  const PADDING = 40;
  const HEADER_Y = 52;
  const QR_X = (W - QR_SIZE) / 2;
  const QR_Y = 90;
  const FOOTER_Y = QR_Y + QR_SIZE + 48;
  const H = FOOTER_Y + 64;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#111111";
  ctx.font = 'bold 32px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCAN FOR MENU", W / 2, HEADER_Y);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, HEADER_Y + 18);
  ctx.lineTo(W - PADDING, HEADER_Y + 18);
  ctx.stroke();

  const img = new window.Image();
  img.onload = () => {
    ctx.drawImage(img, QR_X, QR_Y, QR_SIZE, QR_SIZE);
    ctx.fillStyle = "#111111";
    ctx.font = 'bold 48px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`TABLE ${table.number}`, W / 2, FOOTER_Y);

    const link = document.createElement("a");
    link.download = `qr-table-${table.number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.onerror = () => toast.error("Gagal memuat QR code");
  img.crossOrigin = "anonymous";
  img.src = table.qrDataUrl;
}

function TableCard({ table }: { table: TableRow }) {
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);

  function handleDelete() {
    if (!confirm(`Hapus meja ${table.number}?`)) return;
    startTransition(async () => {
      const res = await deleteTable(table.id);
      if (res.ok) toast.success("Meja dihapus");
      else toast.error(res.error);
    });
  }

  const handleDownload = useCallback(() => {
    setDownloading(true);
    setTimeout(() => {
      try {
        downloadQrImage(table);
      } finally {
        setDownloading(false);
      }
    }, 50);
  }, [table]);

  return (
    <Card size="sm">
      <CardHeader>
        <div>
          <CardTitle>Meja {table.number}</CardTitle>
          {table.name && (
            <CardDescription>{table.name}</CardDescription>
          )}
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="size-7">
                <HugeiconsIcon icon={Menu09Icon} size={16} color="currentColor" />
              </Button>} />
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<a href={table.orderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" />}>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="currentColor" />
                Buka
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={downloading}>
                <HugeiconsIcon icon={Download04Icon} size={16} color="currentColor" />
                {downloading ? "Memproses..." : "Download"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={pending}
                className="text-destructive focus:text-destructive bg:destructive/10"
              >
                <HugeiconsIcon icon={Delete03Icon} size={16} color="currentColor" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex justify-center py-3">
        <Image
          src={table.qrDataUrl}
          alt={`QR Meja ${table.number}`}
          width={128}
          height={128}
          className="size-32"
        />
      </CardContent>
    </Card>
  );
}

export function QrTableManager({ tables }: { tables: TableRow[] }) {
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = tables.filter(
    (t) =>
      t.number.toLowerCase().includes(search.toLowerCase()) ||
      (t.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">QR Table Management</h2>
            <p className="text-sm text-muted-foreground">
              Kelola meja dan QR Code untuk pemesanan pelanggan
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm">
              <HugeiconsIcon icon={PlusSignIcon} size={16} color="currentColor" />
                Tambah
              </Button>} />
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
                  <Button type="submit" loading={pending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            color="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari meja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada meja. Tambahkan meja untuk menghasilkan QR Code.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Meja tidak ditemukan.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((t) => (
            <TableCard key={t.id} table={t} />
          ))}
        </div>
      )}
    </div>
  );
}
