"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { SearchNormal } from "iconsax-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { rupiah } from "@/lib/format";
import type { MenuCategory } from "@/lib/menu";
import type { CartItem, MenuItem } from "./types";

export function MenuSearch({
  menu,
  cart,
  onAdd,
  onChangeQty,
}: {
  menu: MenuCategory[];
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onChangeQty: (itemId: string, delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allItems = useMemo(
    () => menu.flatMap((c) => c.items.filter((i) => i.isAvailable)),
    [menu],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  const items = filtered ?? allItems;

  return (
    <>
      <button
        onClick={() => { setOpen(true); setQuery(""); }}
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
      >
        <SearchNormal size="16" color="currentColor" />
      </button>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[90dvh] flex-col gap-0 rounded-t-2xl p-0"
        >
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Search bar */}
          <div className="shrink-0 px-4 pb-3">
            <div className="relative">
              <SearchNormal
                size="18"
                color="currentColor"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari menu..."
                className="w-full rounded-xl border bg-muted/50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto px-4 pb-6">
            {!query.trim() && (
              <p className="mb-2 text-left text-xs font-semibold tracking-wider text-muted-foreground">
                Yuk, Menu favoritmu semua ada di sini😋
              </p>
            )}
            {items.length === 0 && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                Menu tidak ditemukan
              </p>
            )}
            <div className="divide-y">
              {items.map((item) => renderItem(item))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );

  function renderItem(item: MenuItem) {
    const inCart = cart.find((c) => c.itemId === item.id);
    const outOfStock = item.stock < 1;

    return (
      <div key={item.id} className="flex items-center gap-3 py-2.5">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={52}
            height={52}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
            {item.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.name}</div>
          {item.description && (
            <div className="truncate text-xs text-muted-foreground">
              {item.description}
            </div>
          )}
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {rupiah(item.price)}
          </div>
        </div>
        {outOfStock ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            Stok Habis
          </span>
        ) : inCart ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full text-xs" onClick={() => onChangeQty(item.id, -1)}>&minus;</Button>
            <span className="flex w-4 justify-center text-xs font-medium">{inCart.quantity}</span>
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full text-xs" onClick={() => onChangeQty(item.id, 1)}>+</Button>
          </div>
        ) : (
          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onAdd(item)}>Tambah</Button>
        )}
      </div>
    );
  }
}
