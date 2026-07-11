"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Add, Minus } from "iconsax-react";
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
      <SheetContent side="bottom" className="flex max-h-[80vh] flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 px-4 pt-4">
          <SheetTitle>Keranjang</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 pb-2 pt-3">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Keranjang masih kosong
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((c) => (
                <div key={c.itemId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm font-semibold">
                      {rupiah(c.price * c.quantity)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon-xs"
                      variant="outline"
                      className="size-7 rounded-full"
                      onClick={() => onChangeQty(c.itemId, -1)}
                    >
                      <Minus size="16" color="currentColor" />
                    </Button>
                    <span className="flex w-5 justify-center text-sm font-medium">
                      {c.quantity}
                    </span>
                    <Button
                      size="icon-xs"
                      variant="outline"
                      className="size-7 rounded-full"
                      onClick={() => onChangeQty(c.itemId, 1)}
                    >
                      <Add size="16" color="currentColor" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Catatan (opsional)"
                    value={c.note}
                    onChange={(e) => onSetNote(c.itemId, e.target.value)}
                    className="mt-2 h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t px-4 py-3">
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
          <Button className="w-full" onClick={onContinue}>
            Lanjut ke Konfirmasi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
