"use client";

import { useState } from "react";
import { ArrowLeft, Wallet, ScanBarcode } from "iconsax-react";
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
  sublabel: string;
  icon: typeof Wallet;
}[] = [
  {
    value: "CASH",
    label: "Tunai (di Kasir)",
    sublabel: "Bayar langsung di kasir",
    icon: Wallet,
  },
  {
    value: "QRIS",
    label: "QRIS",
    sublabel: "Scan QRIS statis di kasir",
    icon: ScanBarcode,
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
        {/* Scrollable content area — pb-36 to avoid floating bar overlap */}
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
            <p className="text-sm font-semibold text-foreground">Metode Pembayaran</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.value;
                const Icon = opt.icon;
                return (
                  <RippleButton
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon
                      size="28"
                      color="currentColor"
                      className={selected ? "text-primary" : "text-muted-foreground"}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium leading-tight",
                        selected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {opt.sublabel}
                    </span>
                  </RippleButton>
                );
              })}
            </div>

            {/* Contextual guidance banner */}
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
              <svg
                className="size-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              Setelah kirim pesanan, tunjukkan QR konfirmasi ke kasir untuk menyelesaikan pembayaran.
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
