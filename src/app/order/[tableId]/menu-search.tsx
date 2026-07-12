"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { SearchNormal, Add, Minus } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { RippleButton } from "@/components/ui/ripple-button";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragY = useRef(0);
  const dragStart = useRef(0);
  const isDragging = useRef(false);

  const cartItemIds = useMemo(() => new Set(cart.map((c) => c.itemId)), [cart]);

  const allItems = useMemo(
    () => menu.flatMap((c) => c.items.filter((i) => i.isAvailable || cartItemIds.has(i.id))),
    [menu, cartItemIds],
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    isDragging.current = true;
    dragStart.current = e.touches[0].clientY;
    if (panelRef.current) {
      panelRef.current.style.transition = "none";
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) {
      dragY.current = delta;
      if (panelRef.current) {
        panelRef.current.style.transform = "translateY(" + delta + "px)";
      }
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = panelRef.current;
    if (!el) return;
    const delta = e.changedTouches[0].clientY - dragStart.current;
    if (delta > 80) {
      el.style.transition = "transform 0.25s ease";
      el.style.transform = "translateY(100%)";
      setTimeout(() => {
        setOpen(false);
        document.body.style.overflow = "";
        dragY.current = 0;
        el.style.transform = "";
        el.style.transition = "";
      }, 200);
    } else {
      el.style.transition = "transform 0.25s ease";
      el.style.transform = "";
      dragY.current = 0;
    }
  }

  return (
    <>
      <div className="absolute right-4 top-4">
        <RippleButton
          onClick={() => { setOpen(true); setQuery(""); }}
          className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <SearchNormal size="16" color="currentColor" />
        </RippleButton>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-xs"
            onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
          />
          <div
            ref={panelRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed bottom-0 inset-x-0 mx-auto flex max-w-md flex-col max-h-[90dvh] rounded-t-2xl bg-popover ring-1 ring-foreground/10 shadow-xl transition-[transform] duration-300 ease-out"
          >
            <div className="flex shrink-0 justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="shrink-0 px-4 pb-3">
              <div className="relative">
                <SearchNormal size="18" color="currentColor" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full rounded-xl border bg-muted/50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {!query.trim() && (
                <p className="mb-2 text-left text-xs font-semibold tracking-wider text-muted-foreground">
                  Yuk, Menu favoritmu semua ada di sini??
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
          </div>
        </div>
      )}
    </>
  );

  function renderItem(item: MenuItem) {
    const inCart = cart.find((c) => c.itemId === item.id);
    const outOfStock = item.stock < 1;

    return (
      <div key={item.id} className="flex items-center gap-3 py-2.5">
        <div className="relative shrink-0">
          {item.image ? (
            <Image src={item.image} alt={item.name} width={52} height={52} className="size-12 rounded-lg object-cover" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
              {item.name.charAt(0)}
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.name}</div>
          {item.description && (
            <div className="truncate text-xs text-muted-foreground">{item.description}</div>
          )}
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {rupiah(item.price)}
          </div>
        </div>
        {outOfStock ? (
          <span className="shrink-0 text-xs text-muted-foreground">Sold Out</span>
        ) : inCart ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full" onClick={() => onChangeQty(item.id, -1)}><Minus size="16" color="currentColor" /></Button>
            <span className="flex w-4 justify-center text-xs font-medium">{inCart.quantity}</span>
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full" onClick={() => onChangeQty(item.id, 1)}><Add size="16" color="currentColor" /></Button>
          </div>
        ) : (
          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onAdd(item)}>Tambah</Button>
        )}
      </div>
    );
  }
}
