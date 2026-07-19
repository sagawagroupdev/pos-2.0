"use client";

import { useState } from "react";
import { ArrowLeft } from "iconsax-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupiah } from "@/lib/format";
import { RippleButton } from "@/components/ui/ripple-button";
import type { PaymentMethod } from "./types";

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  assetSrc: string;
}[] = [
  {
    value: "CASH",
    label: "Tunai",
    assetSrc: "/assets/element/cash.svg",
  },
  {
    value: "QRIS",
    label: "QRIS",
    assetSrc: "/assets/element/qris.svg",
  },
];

export function CheckoutStep({
  tableNumber,
  subtotal,
  tax,
  taxRate,
  total,
  submitting,
  onBack,
  onSubmit,
}: {
  tableNumber: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    paymentMethod: PaymentMethod;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim(), paymentMethod });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft size="20" color="currentColor" />
        </Button>
        <h1 className="text-lg font-semibold">Data &amp; Pembayaran</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-col gap-5 overflow-auto p-4 pb-36">

          {/* Customer info section */}
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Informasi Pelanggan</p>

            {/* Nama (required) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-name">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama"
                autoComplete="name"
                enterKeyHint="next"
              />
            </div>

            {/* No. Telepon (opsional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-phone">
                No. Telepon{" "}
                <span className="text-xs font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="cust-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
                enterKeyHint="next"
              />
            </div>

            {/* Email (opsional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-email">
                Email{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (opsional, untuk terima struk)
                </span>
              </Label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                autoComplete="email"
                enterKeyHint="done"
                inputMode="email"
              />
            </div>

            {/* Nomor Meja (locked dari QR) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-table">Nomor Meja</Label>
              <Input
                id="cust-table"
                value={`Meja ${tableNumber}`}
                disabled
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
            </div>
          </div>

          {/* Payment method section */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Preferensi pembayaran</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value;
                return (
                  <RippleButton
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      "flex min-h-20 items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                      selected
                        ? "border-green-500 ring-1 ring-green-500/30 hover:bg-emerald/10"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-muted/70 p-1.5 transition-colors",
                        selected && "bg-green-500/10"
                      )}
                    >
                      <Image
                        src={opt.assetSrc}
                        alt=""
                        width={80}
                        height={48}
                        className="h-auto max-h-9 w-full object-contain"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-left text-sm font-medium leading-tight",
                        selected ? "text-green-600 dark:text-green-400" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                  </RippleButton>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating bar — fixed at bottom */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-md p-4">
            <div className="mb-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PB1 ({taxRate}%)</span>
                  <span>{rupiah(tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{rupiah(total)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Mengirim..." : "Kirim Pesanan"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
