"use client";

import { useState } from "react";
import { gooeyToast } from "gooey-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupiah } from "@/lib/format";
import type { PaymentMethod } from "./types";

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

  function handleSubmit() {
    if (!name.trim() || phone.trim().length < 6) {
      gooeyToast.error({ title: "Lengkapi nama dan no. telepon" });
      return;
    }
    onSubmit({ name, phone, paymentMethod });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          &larr;
        </Button>
        <h1 className="text-lg font-semibold">Data &amp; Pembayaran</h1>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cust-name">Nama</Label>
          <Input
            id="cust-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cust-phone">No. Telepon</Label>
          <Input
            id="cust-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Metode Pembayaran</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={paymentMethod === "CASH" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPaymentMethod("CASH")}
            >
              Tunai (di Kasir)
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "QRIS" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPaymentMethod("QRIS")}
            >
              QRIS
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t bg-background p-4">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between">
              <span>Pajak ({taxRate}%)</span>
              <span>{rupiah(tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{rupiah(total)}</span>
          </div>
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Mengirim..." : "Kirim Pesanan"}
        </Button>
      </div>
    </div>
  );
}
