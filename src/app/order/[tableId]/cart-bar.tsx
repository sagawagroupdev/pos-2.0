"use client";

import { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
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
  const [clickKey, setClickKey] = useState(0);

  const handleClick = useCallback(() => {
    setClickKey((k) => k + 1);
    onOpenCart();
  }, [onOpenCart]);

  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-8 pb-4">
      <button
        onClick={handleClick}
        className="relative w-full animate-in slide-in-from-bottom cursor-pointer overflow-hidden rounded-xl bg-primary p-3 text-primary-foreground shadow-lg transition-all active:scale-[0.97]"
      >
        {clickKey > 0 && (
          <span
            key={clickKey}
            className="pointer-events-none absolute inset-0 animate-[ripple_0.5s_ease-out] rounded-xl bg-black/20"
            onAnimationEnd={() => setClickKey(0)}
          />
        )}
        <span className="flex items-center gap-3">
          <span className="relative">
            <HugeiconsIcon icon={ShoppingBag01Icon} size="22" color="currentColor" strokeWidth={1.5} />
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-bold text-primary">
              {itemCount}
            </span>
          </span>
          <span className="flex-1 text-left text-sm font-medium">Checkout</span>
          <span className="font-semibold">{rupiah(total)}</span>
        </span>
      </button>
    </div>
  );
}
