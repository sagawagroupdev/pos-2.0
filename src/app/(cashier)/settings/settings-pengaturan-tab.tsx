"use client";

import { Switch } from "@/components/ui/switch";
import { BlePrinterStatus } from "@/components/ble-printer-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPengaturanTab({
  taxEnabled,
  enableDraftOrders,
  onTaxToggle,
  onDraftToggle,
}: {
  taxEnabled: boolean;
  enableDraftOrders: boolean;
  onTaxToggle: (checked: boolean) => void;
  onDraftToggle: (checked: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Umum</CardTitle>
        <CardDescription>
          Konfigurasi umum untuk sistem POS Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {/* Pajak */}
        <div className="flex items-center justify-between gap-4 py-4 border-b">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Pajak PB1 10%</span>
            <span className="text-xs text-muted-foreground">
              Terapkan pajak PB1 10% ke setiap transaksi
            </span>
          </div>
          <Switch
            checked={taxEnabled}
            onCheckedChange={onTaxToggle}
          />
        </div>

        {/* Printer */}
        <div className="py-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Printer Thermal</span>
              <span className="text-xs text-muted-foreground">
                Koneksi printer thermal Bluetooth
              </span>
            </div>
            <BlePrinterStatus />
          </div>
        </div>

        {/* Draft Orders */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Pesanan Draft</span>
            <span className="text-xs text-muted-foreground">
              Izinkan kasir menahan pesanan untuk diselesaikan nanti
            </span>
          </div>
          <Switch
            checked={enableDraftOrders}
            onCheckedChange={onDraftToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
