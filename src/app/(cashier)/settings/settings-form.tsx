"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { updateSettings, updateOutletInfo, updateBusinessHours } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlePrinterStatus } from "@/components/ble-printer-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StoreSettings, CashierOutlet } from "@/lib/settings";
import type { BusinessHours } from "@/lib/business-hours";
import { getDefaultBusinessHours } from "@/lib/business-hours";

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function SettingsForm({
  settings,
  outlet,
  businessHours: initialHours,
}: {
  settings: StoreSettings;
  outlet: CashierOutlet;
  businessHours?: BusinessHours;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hoursPending, startHoursTransition] = useTransition();
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    initialHours ?? getDefaultBusinessHours()
  );
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [enableDraftOrders, setEnableDraftOrders] = useState(
    settings.enableDraftOrders
  );
  const [synced, setSynced] = useState({
    taxEnabled: settings.taxEnabled,
    enableDraftOrders: settings.enableDraftOrders,
  });

  if (
    synced.taxEnabled !== settings.taxEnabled ||
    synced.enableDraftOrders !== settings.enableDraftOrders
  ) {
    setSynced({
      taxEnabled: settings.taxEnabled,
      enableDraftOrders: settings.enableDraftOrders,
    });
    setTaxEnabled(settings.taxEnabled);
    setEnableDraftOrders(settings.enableDraftOrders);
  }

  function handleSaveOutlet(formData: FormData) {
    startTransition(async () => {
      const res = await updateOutletInfo(formData);
      if (res.ok) {
        toast.success("Informasi outlet disimpan");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function setDayMode(day: number, mode: "hours" | "24h" | "closed") {
    setBusinessHours((prev) => {
      const prevDay = prev[String(day)] ?? { mode: "24h" };
      return {
        ...prev,
        [String(day)]: {
          mode,
          ...(mode === "hours"
            ? {
                open: prevDay.mode === "hours" ? prevDay.open : "08:00",
                close: prevDay.mode === "hours" ? prevDay.close : "22:00",
              }
            : {}),
        },
      };
    });
  }

  function setDayTime(day: number, field: "open" | "close", value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [String(day)]: { ...prev[String(day)], [field]: value },
    }));
  }

  function handleSaveHours() {
    startHoursTransition(async () => {
      const fd = new FormData();
      for (let d = 1; d <= 7; d++) {
        const day = businessHours[String(d)] ?? { mode: "24h" };
        fd.set(`hours[${d}][mode]`, day.mode);
        if (day.mode === "hours") {
          fd.set(`hours[${d}][open]`, day.open ?? "08:00");
          fd.set(`hours[${d}][close]`, day.close ?? "22:00");
        }
      }
      const res = await updateBusinessHours(fd);
      if (res.ok) {
        toast.success("Jam operasional disimpan");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function handleSaveSettings(formData: FormData) {
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.ok) {
        toast.success("Pengaturan disimpan");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Informasi Outlet — per-cashier */}
      <form action={handleSaveOutlet}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Outlet</CardTitle>
            <CardDescription>
              Data outlet Anda. Tampil di header struk dan halaman pemesanan QR.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="outletName">Nama Outlet</Label>
              <Input
                id="outletName"
                name="outletName"
                defaultValue={outlet.outletName}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="outletAddress">Alamat</Label>
              <Input
                id="outletAddress"
                name="outletAddress"
                defaultValue={outlet.outletAddress ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="outletPhone">No. Telepon</Label>
              <Input
                id="outletPhone"
                name="outletPhone"
                defaultValue={outlet.outletPhone ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="outletLogo">Logo Outlet</Label>
              {outlet.outletLogo && (
                <Image
                  src={outlet.outletLogo}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="size-16 rounded object-contain"
                />
              )}
              <Input
                id="outletLogo"
                name="outletLogo"
                type="file"
                accept="image/*"
              />
            </div>
            <div>
              <Button type="submit" disabled={pending} size="sm">
                {pending ? "Menyimpan..." : "Simpan Outlet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Jam Operasional — per-cashier */}
      <Card>
        <CardHeader>
          <CardTitle>Jam Operasional</CardTitle>
          <CardDescription>
            Atur jam buka outlet setiap hari. Customer tidak bisa order di luar jam operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 7 }, (_, i) => {
            const d = i + 1;
            const day = businessHours[String(d)] ?? { mode: "24h" };
            return (
              <div key={d} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                <span className="w-16 text-sm font-medium">{dayNames[i]}</span>
                <div className="flex gap-1">
                  {(["hours", "24h", "closed"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDayMode(d, m)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        day.mode === m
                          ? m === "hours"
                            ? "bg-primary text-primary-foreground"
                            : m === "24h"
                              ? "bg-emerald-500 text-white"
                              : "bg-destructive text-destructive-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {m === "hours" ? "Buka" : m === "24h" ? "24 Jam" : "Tutup"}
                    </button>
                  ))}
                </div>
                {day.mode === "hours" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={day.open ?? "08:00"}
                      onChange={(e) => setDayTime(d, "open", e.target.value)}
                      className="h-8 w-24 rounded-md border bg-background px-2 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <input
                      type="time"
                      value={day.close ?? "22:00"}
                      onChange={(e) => setDayTime(d, "close", e.target.value)}
                      className="h-8 w-24 rounded-md border bg-background px-2 text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveHours}
              disabled={hoursPending}
            >
              {hoursPending ? "Menyimpan..." : "Simpan Jam Operasional"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pengaturan global — tax, QRIS, printer */}
      <form action={handleSaveSettings}>
        <Card>
          <CardHeader>
            <CardTitle>Pajak</CardTitle>
            <CardDescription>Tarif pajak diterapkan ke transaksi.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-sm">
              <Switch
                name="taxEnabled"
                checked={taxEnabled}
                onCheckedChange={setTaxEnabled}
              />
              Aktifkan pajak
            </label>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taxRate">Tarif Pajak (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={settings.taxRate}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Draft</CardTitle>
            <CardDescription>
              Izinkan kasir menahan pesanan untuk diselesaikan nanti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                name="enableDraftOrders"
                checked={enableDraftOrders}
                onCheckedChange={setEnableDraftOrders}
              />
              Aktifkan pesanan draft (tahan order)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembayaran QRIS</CardTitle>
            <CardDescription>
              Gambar QRIS statis yang ditampilkan ke pelanggan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {settings.qrisImageUrl && (
              <Image
                src={settings.qrisImageUrl}
                alt="QRIS"
                width={160}
                height={160}
                className="size-40 rounded object-contain"
              />
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="qrisImage">Gambar QRIS</Label>
              <Input
                id="qrisImage"
                name="qrisImage"
                type="file"
                accept="image/*"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Struk & Printer</CardTitle>
            <CardDescription>Konfigurasi cetak struk thermal.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="receiptFooter">Pesan Penutup Struk</Label>
              <Input
                id="receiptFooter"
                name="receiptFooter"
                defaultValue={settings.receiptFooter ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="printerName">Nama Printer</Label>
              <Input
                id="printerName"
                name="printerName"
                defaultValue={settings.printerName ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paperSize">Ukuran Kertas</Label>
              <Input
                id="paperSize"
                name="paperSize"
                defaultValue={settings.paperSize ?? "58mm"}
              />
            </div>

            <BlePrinterStatus />
          </CardContent>
        </Card>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
