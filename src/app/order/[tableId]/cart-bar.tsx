"use client";

import { ShoppingCart } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";

export function CartBar({
  itemCount,
  total,
  onOpenCart,
}: {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-4">
      <div className="animate-in slide-in-from-bottom flex items-center gap-3 rounded-xl bg-primary p-3 text-primary-foreground shadow-lg">
        <div className="relative">
          <ShoppingCart size="22" color="currentColor" />
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-bold text-primary">
            {itemCount}
          </span>
        </div>
        <span className="flex-1 text-sm font-medium">Lihat Keranjang</span>
        <span className="font-semibold">{rupiah(total)}</span>
        <Button
          size="sm"
          variant="secondary"
          className="ml-1 shrink-0"
          onClick={onOpenCart}
        >
          Lihat
        </Button>
      </div>
    </div>
  );
}
