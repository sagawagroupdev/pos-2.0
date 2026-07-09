"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Element3, RowVertical } from "iconsax-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { rupiah } from "@/lib/format";
import type { MenuCategory } from "@/lib/menu";
import type { CartItem, MenuItem } from "./types";

type ViewMode = "grid" | "list";

export function MenuList({
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
  const firstCat = menu.find((c) => c.items.some((i) => i.isAvailable))?.id ?? menu[0]?.id;
  const [activeCat, setActiveCat] = useState<string>(firstCat);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const touchStart = useRef({ x: 0, y: 0 });

  const availableCats = menu.filter((c) => c.items.some((i) => i.isAvailable));

  if (menu.length === 0) {
    return <p className="text-muted-foreground">Menu belum tersedia.</p>;
  }

  const displayItems = menu
    .flatMap((c) => c.items.filter((i) => i.isAvailable))
    .filter((i) => i.categoryId === activeCat);

  function selectCat(id: string) {
    setActiveCat(id);
    setSheetOpen(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

    const idx = availableCats.findIndex((c) => c.id === activeCat);
    if (dx > 0 && idx > 0) {
      selectCat(availableCats[idx - 1].id);
    } else if (dx < 0 && idx < availableCats.length - 1) {
      selectCat(availableCats[idx + 1].id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div className="flex gap-4 overflow-x-auto border-b">
        {/* Sticky left: toggle view + Kategori */}
        <div className="sticky left-0 z-10 flex items-center gap-1 bg-background pr-1">
          {/* View toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="flex items-center border-b-2 border-transparent px-1 py-2 text-muted-foreground hover:text-foreground"
          >
            {viewMode === "grid" ? (
              <RowVertical size="18" color="currentColor" />
            ) : (
              <Element3 size="18" color="currentColor" />
            )}
          </button>

          {/* Kategori button */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <button className="whitespace-nowrap border-b-2 border-transparent px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Kategori
                </button>
              }
            />
            <SheetContent
              side="bottom"
              className="flex max-h-[60vh] flex-col gap-0 p-0"
            >
              <SheetHeader className="shrink-0 px-4 pt-4">
                <SheetTitle>Kategori</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto px-4 pb-4 pt-2">
                {menu.map((cat) => {
                  const count = cat.items.filter((i) => i.isAvailable).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCat(cat.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        activeCat === cat.id
                          ? "bg-primary/10 font-semibold text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {cat.name}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category tabs — direct filter */}
        {menu.map((cat) => {
          if (cat.items.filter((i) => i.isAvailable).length === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors border-transparent text-muted-foreground hover:text-foreground data-[active=true]:border-primary data-[active=true]:text-foreground data-[active=true]:font-semibold"
              data-active={activeCat === cat.id}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {displayItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Tidak ada item di kategori ini.
        </p>
      ) : viewMode === "grid" ? (
        <div
          className="grid grid-cols-2 gap-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {displayItems.map((item) => renderGridItem(item))}
        </div>
      ) : (
        <div
          className="divide-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {displayItems.map((item) => renderListItem(item))}
        </div>
      )}
    </div>
  );

  function renderListItem(item: MenuItem) {
    const inCart = cart.find((c) => c.itemId === item.id);
    const outOfStock = item.stock < 1;

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-2.5 py-2.5 transition-colors",
          outOfStock && "opacity-50"
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
            {item.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="text-sm font-semibold text-slate-900">
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

  function renderGridItem(item: MenuItem) {
    const inCart = cart.find((c) => c.itemId === item.id);
    const outOfStock = item.stock < 1;

    return (
      <div
        key={item.id}
        className={cn(
          "flex flex-col gap-2 rounded-lg border p-2.5 transition-colors",
          outOfStock && "opacity-50"
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={160}
            height={160}
            className="aspect-square w-full rounded-md object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-lg font-bold text-muted-foreground">
            {item.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {rupiah(item.price)}
          </div>
        </div>
        {outOfStock ? (
          <span className="text-center text-xs text-muted-foreground">Stok Habis</span>
        ) : inCart ? (
          <div className="flex items-center justify-center gap-1">
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full text-xs" onClick={() => onChangeQty(item.id, -1)}>&minus;</Button>
            <span className="flex w-4 justify-center text-xs font-medium">{inCart.quantity}</span>
            <Button size="icon-xs" variant="outline" className="size-6 rounded-full text-xs" onClick={() => onChangeQty(item.id, 1)}>+</Button>
          </div>
        ) : (
          <Button size="sm" className="h-7 w-full text-xs" onClick={() => onAdd(item)}>Tambah</Button>
        )}
      </div>
    );
  }
}
