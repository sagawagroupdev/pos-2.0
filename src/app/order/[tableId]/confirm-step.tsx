"use client";

import { ArrowLeft } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import type { CartItem } from "./types";

export function ConfirmStep({
  cart,
  subtotal,
  tax,
  taxRate,
  total,
  onBack,
  onContinue,
}: {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft size="20" color="currentColor" />
        </Button>
        <h1 className="text-lg font-semibold">Konfirmasi Pesanan</h1>
      </header>

      <div className="flex-1 space-y-2 overflow-auto p-4">
        {cart.map((c) => (
          <div key={c.itemId} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {c.quantity}x {c.name}
              </span>
              <span className="text-sm font-semibold">
                {rupiah(c.price * c.quantity)}
              </span>
            </div>
            {c.note && (
              <p className="mt-1 text-xs text-muted-foreground">
                Catatan: {c.note}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t bg-background p-4">
        <div className="mb-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Pajak ({taxRate}%)
              </span>
              <span>{rupiah(tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{rupiah(total)}</span>
          </div>
        </div>
        <Button className="w-full" onClick={onContinue}>
          Lanjut ke Pembayaran
        </Button>
      </div>
    </div>
  );
}
