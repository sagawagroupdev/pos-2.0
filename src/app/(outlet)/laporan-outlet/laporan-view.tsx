"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pdf01Icon, Calendar01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import { loadLaporan } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rupiah, dateStrInTz, formatInTz } from "@/lib/format";
import type { OutletReportData } from "@/lib/reports";

type OutletInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
  pic: string | null;
};

function fmt(d: string) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

function todayStr() {
  return dateStrInTz(new Date());
}
function monthStartStr() {
  return `${todayStr().slice(0, 7)}-01`;
}
function shiftDay(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  d.setDate(d.getDate() + days);
  return dateStrInTz(d);
}
function weekStartStr() {
  return shiftDay(todayStr(), -6);
}
function yesterdayStr() {
  return shiftDay(todayStr(), -1);
}

const PRESETS = [
  { label: "Hari ini", getRange: () => ({ from: todayStr(), to: todayStr() }) },
  { label: "Kemarin", getRange: () => ({ from: yesterdayStr(), to: yesterdayStr() }) },
  { label: "Minggu ini", getRange: () => ({ from: weekStartStr(), to: todayStr() }) },
  { label: "Bulan ini", getRange: () => ({ from: monthStartStr(), to: todayStr() }) },
] as const;

export function LaporanOutletView({
  initialData,
  outletInfo,
  defaultFrom,
  defaultTo,
}: {
  initialData: OutletReportData;
  outletInfo: OutletInfo;
  defaultFrom: string;
  defaultTo: string;
}) {
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState(initialData);
  const [activePreset, setActivePreset] = useState<string>("Bulan ini");
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("");

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = previewFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function handleExportPDF() {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      // ── Logo (fetch → base64) ──
      let logoBase64: string | null = null;
      if (outletInfo.logo) {
        try {
          const resp = await fetch(outletInfo.logo);
          const blob = await resp.blob();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          // logo gagal dimuat — lanjut tanpa logo
        }
      }

      // ── Header ──
      const logoSize = 16; // mm
      const textLeft = logoBase64 ? margin + logoSize + 4 : margin;

      if (logoBase64) {
        pdf.addImage(logoBase64, margin, margin - 2, logoSize, logoSize);
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(outletInfo.name, textLeft, y);
      y += 6;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      if (outletInfo.address) { pdf.text(outletInfo.address, textLeft, y); y += 4.5; }
      if (outletInfo.phone) { pdf.text(`Telp: ${outletInfo.phone}`, textLeft, y); y += 4.5; }
      if (outletInfo.pic) { pdf.text(`PIC: ${outletInfo.pic}`, textLeft, y); y += 4.5; }

      // Title (right-aligned)
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Laporan Penjualan", pageW - margin, margin, { align: "right" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      const fmtPeriod = (d: string) =>
        new Date(`${d}T00:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      pdf.text(`Periode: ${fmtPeriod(from)} – ${fmtPeriod(to)}`, pageW - margin, margin + 6, { align: "right" });
      pdf.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        pageW - margin, margin + 10.5, { align: "right" }
      );

      // Divider
      y = Math.max(y, margin + 14) + 2;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;

      // ── Summary boxes ──
      pdf.setTextColor(0, 0, 0);
      const summaries = [
        { label: "Total Omset", value: rupiah(data.totalRevenue) },
        { label: "Rata-rata Transaksi", value: rupiah(data.avgTransaction) },
        { label: "Omset Cash", value: rupiah(cashRevenue) },
        { label: "Omset QRIS", value: rupiah(data.qrisRevenue) },
      ];
      const boxW = (pageW - margin * 2 - 9) / 4;
      summaries.forEach((s, i) => {
        const bx = margin + i * (boxW + 3);
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);
        pdf.rect(bx, y, boxW, 14);
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text(s.label.toUpperCase(), bx + 3, y + 4.5);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(s.value, bx + 3, y + 10.5);
      });
      y += 20;

      // ── Top 5 Produk & Metode Pembayaran (Berdampingan) ──
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Top 5 Produk Terlaris", margin, y);
      pdf.text("Metode Pembayaran", margin + 130 + 9, y);
      y += 3;

      // Tabel Kiri: Top 5 Produk
      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: pageW - margin - 130 },
        head: [["No", "Nama Produk", "Qty", "Omset"]],
        body: data.topItems.map((item, i) => [
          i + 1,
          item.name,
          item.quantity,
          rupiah(item.total),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 15, halign: "right" },
          3: { cellWidth: 30, halign: "right" },
        },
      });
      const yLeft = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

      // Tabel Kanan: Metode Pembayaran
      autoTable(pdf, {
        startY: y,
        margin: { left: margin + 130 + 9, right: margin },
        head: [["Metode", "Transaksi", "Omset", "%"]],
        body: data.paymentBreakdown.map((p) => {
          const pct = data.totalRevenue > 0 ? Math.round((p.total / data.totalRevenue) * 100) : 0;
          return [p.method, p.count, rupiah(p.total), `${pct}%`];
        }),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 20, halign: "right" },
          2: { cellWidth: 35, halign: "right" },
          3: { cellWidth: 15, halign: "right" },
        },
      });
      const yRight = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

      // Ambil Y maksimum untuk tabel Daftar Transaksi berikutnya
      y = Math.max(yLeft, yRight) + 10;

      // ── Transaction table ──
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Daftar Transaksi (${data.totalTransactions} transaksi)`, margin, y);
      y += 3;

      const fmtDatePdf = (iso: string) =>
        formatInTz(iso, { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

      const totalSubtotal = data.transactions.reduce((s, t) => s + t.subtotal, 0);

      autoTable(pdf, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["No", "Tanggal", "ID Transaksi", "Kasir", "Customer", "Metode", "Item Order", "Subtotal", "Total"]],
        body: data.transactions.map((t, i) => [
          i + 1,
          fmtDatePdf(t.date),
          t.orderNumber,
          t.cashierName,
          t.customerName ?? "—",
          t.paymentMethod,
          t.items,
          rupiah(t.subtotal),
          rupiah(t.total),
        ]),
        foot: data.transactions.length > 0
          ? [["", "", "", "", "", "", "Total", rupiah(totalSubtotal), rupiah(data.totalRevenue)]]
          : undefined,
        styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 22 },
          2: { cellWidth: 28 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 18 },
          6: { cellWidth: "auto" },
          7: { cellWidth: 28, halign: "right" },
          8: { cellWidth: 28, halign: "right" },
        },
      });

      const formatFilenameDate = (dStr: string) => {
        const [y, m, d] = dStr.split("-");
        return `${d}-${m}-${y}`;
      };
      const safeOutletName = outletInfo.name.replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `Laporan-${safeOutletName}-${formatFilenameDate(from)}-sd-${formatFilenameDate(to)}.pdf`;
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      setPreviewFilename(filename);
    } catch (e) {
      console.error(e);
      toast.error("Gagal export PDF");
    } finally {
      setExporting(false);
    }
  }

  function applyRange(newFrom: string, newTo: string, preset?: string) {
    setFrom(newFrom);
    setTo(newTo);
    setActivePreset(preset ?? "");
    startTransition(async () => {
      try {
        const res = await loadLaporan(newFrom, newTo);
        setData(res);
      } catch {
        toast.error("Gagal memuat laporan");
      }
    });
  }

  const fmtDate = (iso: string) =>
    formatInTz(iso, { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  const cashRevenue = data.paymentBreakdown.find((p) => p.method === "CASH")?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan penjualan outlet Anda
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={data.totalTransactions === 0 || exporting}>
          <HugeiconsIcon icon={Pdf01Icon} className="h-4 w-4" color="currentColor" />
          {exporting ? "Mengekspor…" : "Unduh PDF"}
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Periode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                size="lg"
                variant={activePreset === p.label ? "default" : "outline"}
                onClick={() => {
                  const r = p.getRange();
                  applyRange(r.from, r.to, p.label);
                }}
                disabled={pending}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* Custom range */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Pilih Tanggal</Label>
              <Popover>
                <PopoverTrigger className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground cursor-pointer">
                  <HugeiconsIcon icon={Calendar01Icon} color="currentColor" size={16} />
                  {from && to
                    ? `${fmt(from)} — ${fmt(to)}`
                    : "Pilih tanggal"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                  <Calendar
                    range={{
                      from: from ? new Date(from + "T00:00:00") : undefined,
                      to: to ? new Date(to + "T00:00:00") : undefined,
                    }}
                    onSelectRange={(r) => {
                      if (r.from) {
                        const f = dateStrInTz(r.from);
                        const t = r.to ? dateStrInTz(r.to) : f;
                        setFrom(f);
                        setTo(t);
                        setActivePreset("");
                        if (r.to) {
                          applyRange(f < t ? f : t, f < t ? t : f);
                        }
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Omset</CardDescription>
            <CardTitle className="text-xl">{rupiah(data.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rata-rata Transaksi</CardDescription>
            <CardTitle className="text-xl">{rupiah(data.avgTransaction)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Transaksi</CardDescription>
            <CardTitle className="text-xl">{data.totalTransactions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Omset QRIS</CardDescription>
            <CardTitle className="text-xl">{rupiah(data.qrisRevenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Top 5 + Payment breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 5 Produk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Produk</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">#</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right pr-4">Omset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topItems.map((item, i) => (
                    <TableRow key={item.name}>
                      <TableCell className="pl-4 text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right pr-4">{rupiah(item.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Metode</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Omset</TableHead>
                  <TableHead className="text-right pr-4">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.paymentBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  data.paymentBreakdown.map((p) => {
                    const pct =
                      data.totalRevenue > 0
                        ? Math.round((p.total / data.totalRevenue) * 100)
                        : 0;
                    return (
                      <TableRow key={p.method}>
                        <TableCell className="pl-4 font-medium">{p.method}</TableCell>
                        <TableCell className="text-right">{p.count}</TableCell>
                        <TableCell className="text-right">{rupiah(p.total)}</TableCell>
                        <TableCell className="text-right pr-4 text-muted-foreground">{pct}%</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Transaction table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Transaksi</CardTitle>
          <CardDescription>
            {data.totalTransactions} transaksi dalam periode ini
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-10">No</TableHead>
                  <TableHead>Tgl</TableHead>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Kasir</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Item Order</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right pr-4">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Tidak ada transaksi dalam periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((t, i) => (
                    <TableRow key={t.id} className="text-xs">
                      <TableCell className="pl-4 py-1 text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="py-1 whitespace-nowrap">{fmtDate(t.date)}</TableCell>
                      <TableCell className="py-1 font-mono text-[11px]">{t.orderNumber}</TableCell>
                      <TableCell className="py-1">{t.cashierName}</TableCell>
                      <TableCell className="py-1">{t.customerName ?? "—"}</TableCell>
                      <TableCell className="py-1">{t.paymentMethod}</TableCell>
                      <TableCell className="py-1 max-w-50 truncate" title={t.items}>{t.items}</TableCell>
                      <TableCell className="py-1 text-right">{rupiah(t.subtotal)}</TableCell>
                      <TableCell className="py-1 text-right pr-4 font-medium">{rupiah(t.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) handleClosePreview(); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-5xl">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Pratinjau PDF</DialogTitle>
              <DialogDescription className="text-xs">
                {previewFilename}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-8">
              <Button onClick={handleDownload} size="sm">
                <HugeiconsIcon icon={Download04Icon} className="h-4 w-4" color="currentColor" />
                Unduh PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-muted relative">
            {previewUrl && (
              <iframe
                src={`${previewUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}