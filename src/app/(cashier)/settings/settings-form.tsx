"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { updateSettings, updateOutletInfo } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StoreSettings, CashierOutlet } from "@/lib/settings";

export function SettingsForm({
  settings,
  outlet,
}: {
  settings: StoreSettings;
  outlet: CashierOutlet;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
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
