"use client";

import { useMemo } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowLeft01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { RippleButton } from "@/components/ui/ripple-button";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/menu";
import type { CartItem, OrderType, MenuItem } from "./types";

export function ConfirmStep({
  orderType,
  menu,
  cart,
  subtotal,
  tax,
  taxRate,
  total,
  globalNote,
  onChangeQty,
  onSetNote,
  onAddItem,
  onGlobalNoteChange,
  onBack,
  onContinue,
}: {
  orderType: OrderType;
  menu: MenuCategory[];
  cart: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  globalNote: string;
  onChangeQty: (itemId: string, delta: number) => void;
  onSetNote: (itemId: string, note: string) => void;
  onAddItem: (item: MenuItem) => void;
  onGlobalNoteChange: (note: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.itemId)), [cart]);

  const allItems = useMemo(() => menu.flatMap((cat) => cat.items), [menu]);

  const relatedItems = useMemo(
    () => allItems.filter((i) => i.stock > 0 && i.isAvailable && !cartIds.has(i.id)),
    [allItems, cartIds],
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header — Order Type */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3">
        <RippleButton
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size="20" color="currentColor" strokeWidth={1.5} />
        </RippleButton>
        <div className="flex-1">
          <h1 className="text-base font-semibold">Konfirmasi Pesanan</h1>
          <p className="text-xs text-muted-foreground">
            {orderType === "DINE_IN" ? "Dine In" : "Take Away"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-28">
        {/* Related Menu — Horizontal Scroll */}
        {relatedItems.length > 0 && (
          <section className="px-4 pt-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Menu Serupa
            </h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-none">
              {relatedItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "w-32 shrink-0 snap-start rounded-xl border bg-card shadow-sm",
                    !item.isAvailable && "opacity-70"
                  )}
                >
                  <div className="relative h-22 overflow-hidden rounded-t-xl bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="text-xs font-semibold text-primary">
                      {rupiah(item.price)}
                    </p>
                    {!item.isAvailable ? (
                      <div className="mt-1.5 flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-muted py-1 text-[11px] font-semibold text-muted-foreground">
                        <HugeiconsIcon icon={Add01Icon} size="12" color="currentColor" strokeWidth={1.5} />
                        Sold Out
                      </div>
                    ) : (
                      <RippleButton
                        onClick={() => onAddItem(item)}
                        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-1 text-[11px] font-semibold text-primary-foreground active:scale-[0.95]"
                      >
                        <HugeiconsIcon icon={Add01Icon} size="12" color="currentColor" strokeWidth={1.5} />
                        Tambah
                      </RippleButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Order Items */}
        <section className="px-4 pt-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pesanan <span className="text-primary">({itemCount})</span>
          </h2>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada pesanan
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((c) => (
                <div key={c.itemId} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-semibold">
                      {rupiah(c.price * c.quantity)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <RippleButton
                      onClick={() => onChangeQty(c.itemId, -1)}
                      className="flex size-7 items-center justify-center rounded-full border hover:bg-muted active:scale-90"
                    >
                      <HugeiconsIcon icon={MinusSignIcon} size="14" color="currentColor" strokeWidth={1.5} />
                    </RippleButton>
                    <span className="flex w-5 justify-center text-sm font-medium">
                      {c.quantity}
                    </span>
                    <RippleButton
                      onClick={() => onChangeQty(c.itemId, 1)}
                      className="flex size-7 items-center justify-center rounded-full border hover:bg-muted active:scale-90"
                    >
                      <HugeiconsIcon icon={Add01Icon} size="14" color="currentColor" strokeWidth={1.5} />
                    </RippleButton>
                  </div>
                  <Input
                    placeholder="Catatan menu (opsional)"
                    value={c.note}
                    onChange={(e) => onSetNote(c.itemId, e.target.value)}
                    className="mt-2 h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Note */}
        {cart.length > 0 && (
          <section className="px-4 pt-3">
            <textarea
              placeholder="Catatan lainnya (opsional)"
              value={globalNote}
              onChange={(e) => onGlobalNoteChange(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border bg-muted/50 p-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </section>
        )}

        {/* Payment Detail Card */}
        {cart.length > 0 && (
          <section className="px-4 pt-3">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detail Pembayaran
            </h2>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal{" "}
                    <span className="text-foreground">({itemCount})</span>
                  </span>
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
                <hr className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{rupiah(total)}</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Floating Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-3">
          <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg">
            <div>
              <p className="text-xs opacity-80">Total Pembayaran</p>
              <p className="text-md font-bold">{rupiah(total)}</p>
            </div>
            <RippleButton
              onClick={onContinue}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all active:scale-[0.95]"
            >
              Lanjut Bayar
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </RippleButton>
          </div>
        </div>
      )}
    </div>
  );
}
