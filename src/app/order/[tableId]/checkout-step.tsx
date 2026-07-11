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
  icon: typeof Wallet;
}[] = [
  { value: "CASH", label: "Tunai (di Kasir)", icon: Wallet },
  { value: "QRIS", label: "QRIS", icon: ScanBarcode },
];

export function CheckoutStep({
  subtotal,
  tax,
  taxRate,
  total,
  submitting,
  onBack,
  onSubmit,
}: {
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    paymentMethod: PaymentMethod;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (phone.trim().length < 6) {
      toast.error("No. telepon minimal 6 karakter");
      return;
    }
    onSubmit({ name: name.trim(), phone: phone.trim(), paymentMethod });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft size="20" color="currentColor" />
        </Button>
        <h1 className="text-lg font-semibold">Data &amp; Pembayaran</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col justify-between"
      >
        <div className="flex flex-col gap-4 overflow-auto p-4">
          {/* Customer fields */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="cust-name">Nama</Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama"
              required
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cust-phone">No. Telepon</Label>
            <Input
              id="cust-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
              autoComplete="tel"
              enterKeyHint="done"
            />
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-2">
            <Label>Metode Pembayaran</Label>
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
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
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
                        "text-sm font-medium",
                        selected ? "text-primary" : "text-foreground"
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

        {/* Bottom summary + submit */}
        <div className="sticky bottom-0 border-t bg-background p-4">
          <div className="mb-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  PB1 ({taxRate}%)
                </span>
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
      </form>
    </div>
  );
}
