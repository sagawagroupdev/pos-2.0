"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { updateSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StoreSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.ok) toast.success("Pengaturan disimpan");
      else toast.error(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Toko</CardTitle>
          <CardDescription>
            Tampil di header struk dan halaman pemesanan QR.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="storeName">Nama Toko</Label>
            <Input
              id="storeName"
              name="storeName"
              defaultValue={settings.storeName}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              name="address"
              defaultValue={settings.address ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={settings.phone ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="logo">Logo</Label>
            {settings.logoUrl && (
              <Image
                src={settings.logoUrl}
                alt="Logo"
                width={64}
                height={64}
                className="size-16 rounded object-contain"
              />
            )}
            <Input id="logo" name="logo" type="file" accept="image/*" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pajak</CardTitle>
          <CardDescription>Tarif pajak diterapkan ke transaksi.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="taxEnabled"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="size-4"
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
  );
}
