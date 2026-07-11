"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { rupiah } from "@/lib/format";
import type { MenuItem } from "./types";

export function MenuDetail({
  item,
  onAdd,
  onOpenChange,
}: {
  item: MenuItem | null;
  onAdd: (item: MenuItem, note: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const [dragY, setDragY] = useState(0);

  if (!item) return null;

  const outOfStock = item.stock < 1;

  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function handleTouchEnd() {
    if (dragY > 80) {
      onOpenChange(false);
    }
    setDragY(0);
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) {
      formRef.current?.reset();
      setDragY(0);
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        ref={panelRef}
        className="flex max-h-[95dvh] flex-col gap-0 p-0"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : { transition: "transform 0.25s ease" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <form ref={formRef} onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onAdd(item!, (fd.get("note") as string) || "");
          onOpenChange(false);
        }} className="flex flex-col overflow-y-auto">
          <div className="flex shrink-0 justify-center pt-2 pb-0">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="relative h-56 shrink-0 overflow-hidden">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                {item.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
            <div className="absolute right-4 top-4 z-10">
              <RippleButton type="button" onClick={() => onOpenChange(false)} className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="M6 6l12 12" />
                </svg>
              </RippleButton>
            </div>
          </div>

          <div className="flex flex-col px-4 pt-4 pb-4">
            <h1 className="text-lg font-bold">{item.name}</h1>
            <p className="mt-1 text-lg font-semibold text-primary">{rupiah(item.price)}</p>
            {item.description && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>}

            <div className="mt-6">
              <label htmlFor="note" className="text-sm font-medium text-muted-foreground">
                Catatan <span className="text-xs text-muted-foreground/60">(opsional)</span>
              </label>
              <textarea
                ref={textareaRef}
                id="note" name="note"
                placeholder="Contoh: Sambelnya dipinggir..."
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border bg-muted/50 p-3 text-sm outline-none transition-colors focus:border-primary"
                onFocus={() => textareaRef.current?.scrollIntoView({ block: "center" })}
              />
            </div>
          </div>

          <div className="px-4 pb-8">
            {outOfStock ? (
              <span className="flex items-center justify-center rounded-full bg-muted px-4 py-3 text-sm text-muted-foreground">Stok Habis</span>
            ) : (
              <RippleButton type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all active:scale-[0.98]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
                Tambah
              </RippleButton>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
