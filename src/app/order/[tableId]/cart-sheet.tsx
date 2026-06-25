"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { rupiah } from "@/lib/format";
import type { CartItem } from "./types";

export function CartSheet({
  open,
  onOpenChange,
  cart,
  subtotal,
  tax,
  taxRate,
  total,
  onChangeQty,
  onSetNote,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  onChangeQty: (itemId: string, delta: number) => void;
  onSetNote: (itemId: string, note: string) => void;
  onContinue: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Keranjang</SheetTitle>
        </SheetHeader>

        <div className="flex max-h-[45vh] flex-col gap-2 overflow-auto p-4">
          {cart.map((c) => (
            <div key={c.itemId} className="rounded-md border p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.name}</span>
                <span>{rupiah(c.price * c.quantity)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeQty(c.itemId, -1)}
                >
                  -
                </Button>
                <span className="w-5 text-center">{c.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChangeQty(c.itemId, 1)}
                >
                  +
                </Button>
              </div>
              <Input
                placeholder="Catatan (opsional)"
                value={c.note}
                onChange={(e) => onSetNote(c.itemId, e.target.value)}
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t p-4">
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
          <Button className="w-full" onClick={onContinue}>
            Lanjutkan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
