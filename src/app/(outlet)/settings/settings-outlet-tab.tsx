"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashierOutlet } from "@/lib/settings";

export function SettingsOutletTab({
  outlet,
  pending,
  onSubmit,
}: {
  outlet: CashierOutlet;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form action={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informasi Outlet</CardTitle>
          <CardDescription>
            Data outlet Anda. Informasi ini muncul di header struk dan halaman
            QR order pelanggan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[160px_1fr]">
            <Label
              htmlFor="outletLogo"
              className="flex cursor-pointer flex-col items-center gap-3"
            >
              <div className="relative size-32 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary">
                {outlet.outletLogo ? (
                  <Image
                    src={outlet.outletLogo}
                    alt="Logo outlet"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      size={32}
                      color="currentColor"
                    />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <HugeiconsIcon
                    icon={Upload01Icon}
                    size={24}
                    color="white"
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Klik untuk upload logo
              </span>
              <Input
                id="outletLogo"
                name="outletLogo"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </Label>

            {/* Input fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="outletName">Nama Outlet</Label>
                <Input
                  id="outletName"
                  name="outletName"
                  defaultValue={outlet.outletName}
                  placeholder="e.g. Warung Sate Pak Budi"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="outletAddress">Alamat</Label>
                <Textarea
                  id="outletAddress"
                  name="outletAddress"
                  defaultValue={outlet.outletAddress ?? ""}
                  placeholder="Jl. Merdeka No. 123"
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="outletPhone">No. Telepon</Label>
                <Input
                  id="outletPhone"
                  name="outletPhone"
                  defaultValue={outlet.outletPhone ?? ""}
                  placeholder="0812-3456-7890"
                />
              </div>
              <div>
                <Button type="submit" loading={pending} size="sm">
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
