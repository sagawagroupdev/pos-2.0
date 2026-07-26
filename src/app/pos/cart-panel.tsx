"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Dish01Icon, Delete02Icon, Restaurant01Icon, ShoppingBag01Icon, UserIcon, TableRoundIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { rupiah } from "@/lib/format";

export type OrderType = "DINE_IN" | "TAKE_AWAY";
export type PaymentMethod = "CASH" | "CARD" | "QRIS";

export type CartItem = {
  itemId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  note: string;
  image: string | null;
};

const filledInput =
  "border-transparent bg-muted/60 focus-visible:bg-background";

type CartPanelProps = {
  items: CartItem[];
  itemCount: number;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  tableNumber: string;
  onTableNumberChange: (v: string) => void;
  orderType: OrderType;
  onOrderTypeChange: (v: OrderType) => void;
  note: string;
  onNoteChange: (v: string) => void;
  discountPercent: number;
  onDiscountPercentChange: (v: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (v: PaymentMethod) => void;
  paidAmount: number;
  onPaidAmountChange: (v: number) => void;
  subtotal: number;
  discountAmount: number;
  tax: number;
  taxRate: number;
  taxEnabled: boolean;
  total: number;
  change: number;
  submitting: boolean;
  canPrintLast: boolean;
  enableDraftOrders: boolean;
  holding: boolean;
  resumingDraftId: string | null;
  onChangeQty: (itemId: string, delta: number) => void;
  onSetNote: (itemId: string, note: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  onHold: () => void;
  onPrintLast: () => void;
  onCloseCart?: () => void;
  className?: string;
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "QRIS", label: "QRIS" },
];

export function CartPanel({
  items,
  itemCount,
  customerName,
  onCustomerNameChange,
  tableNumber,
  onTableNumberChange,
  orderType,
  onOrderTypeChange,
  note,
  onNoteChange,
  discountPercent,
  onDiscountPercentChange,
  paymentMethod,
  onPaymentMethodChange,
  paidAmount,
  onPaidAmountChange,
  subtotal,
  discountAmount,
  tax,
  taxRate,
  taxEnabled,
  total,
  change,
  submitting,
  canPrintLast,
  enableDraftOrders,
  holding,
  resumingDraftId,
  onChangeQty,
  onSetNote,
  onClear,
  onSubmit,
  onHold,
  onPrintLast,
  onCloseCart,
  className,
}: CartPanelProps) {
  const hasItems = items.length > 0;

  return (
    <aside className={cn("relative flex w-80 shrink-0 flex-col border-l", className)}>
      <header className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {onCloseCart && (
            <button
              type="button"
              onClick={onCloseCart}
              className="flex items-center justify-center lg:hidden"
              aria-label="Tutup keranjang"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={1.5} />
            </button>
          )}
          <h2 className="text-base font-semibold">Keranjang</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasItems && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-70"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" strokeWidth={1.5} />
              Hapus semua
            </button>
          )}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-500">
            {itemCount} item
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-57.5">
          <div className="flex flex-col gap-2 px-2 pb-2">
            <div className="relative">
              <HugeiconsIcon
                icon={UserIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Nama pelanggan..."
                className={cn(filledInput, "h-9 rounded-lg pl-8")}
              />
            </div>

            <div className="relative">
              <HugeiconsIcon
                icon={TableRoundIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                placeholder="No. Meja..."
                className={cn(filledInput, "h-9 rounded-lg pl-8")}
              />
            </div>

            {hasItems ? (
              <div className="flex flex-col gap-1.5">
                {items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-background">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-muted-foreground">
                            <HugeiconsIcon icon={Dish01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-3 wrap-break-word text-xs font-medium leading-tight">
                          {item.name}
                        </p>
                        <p className="text-xs font-medium text-primary">
                          {rupiah(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-xs"
                          variant="outline"
                          onClick={() => onChangeQty(item.itemId, -1)}
                          aria-label="Kurangi"
                        >
                          −
                        </Button>
                        <span className="w-4 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon-xs"
                          variant="outline"
                          onClick={() => onChangeQty(item.itemId, 1)}
                          aria-label="Tambah"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={item.note}
                      onChange={(e) => onSetNote(item.itemId, e.target.value)}
                      placeholder="Catatan item (opsional)"
                      className="h-7 rounded-md text-xs"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Keranjang kosong
              </p>
            )}

            <div className="mt-0.5 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Tipe Pesanan
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOrderTypeChange("DINE_IN")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors",
                    orderType === "DINE_IN"
                      ? "border-blue-500 bg-blue-100 text-blue-500"
                      : "border-border bg-muted/40 hover:bg-muted"
                  )}
                >
                  <HugeiconsIcon icon={Restaurant01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                  Dine In
                </button>
                <button
                  type="button"
                  onClick={() => onOrderTypeChange("TAKE_AWAY")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors",
                    orderType === "TAKE_AWAY"
                      ? "border-blue-500 bg-blue-100 text-blue-500"
                      : "border-border bg-muted/40 hover:bg-muted"
                  )}
                >
                  <HugeiconsIcon icon={ShoppingBag01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                  Take Away
                </button>
              </div>
            </div>

            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Catatan pesanan..."
              rows={1}
              className={cn(filledInput, "rounded-lg")}
            />
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                value={discountPercent || ""}
                onChange={(e) =>
                  onDiscountPercentChange(
                    Math.min(100, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                placeholder="Diskon (%)"
                className={cn(filledInput, "no-spinner h-9 rounded-lg")}
              />
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            className="border-t bg-background px-3 py-2.5"
          >
            <input type="hidden" name="paidAmount" value={paidAmount} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
            <input type="hidden" name="discountPercent" value={discountPercent} />
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{rupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Diskon ({discountPercent}%)</span>
                    <span>-{rupiah(discountAmount)}</span>
                  </div>
                )}
                {taxEnabled && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>PB1 {taxRate}%</span>
                    <span>{rupiah(tax)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-bold text-primary">
                  {rupiah(total)}
                </span>
              </div>

              {paymentMethod === "CASH" && (
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={paidAmount ? paidAmount.toLocaleString("id-ID") : ""}
                    onChange={(e) =>
                      onPaidAmountChange(Number(e.target.value.replace(/\D/g, "")) || 0)
                    }
                    placeholder="Jumlah bayar"
                    name="paidAmountDisplay"
                    className={cn(filledInput, "h-9 rounded-lg pl-8")}
                  />
                  {paidAmount > 0 && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Kembali {rupiah(change)}
                    </span>
                  )}
                </div>
              )}

              <ButtonGroup className="w-full">
                {PAYMENT_METHODS.map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    variant={paymentMethod === m.value ? "default" : "outline"}
                    onClick={() => onPaymentMethodChange(m.value)}
                    className="h-9 flex-1"
                  >
                    {m.label}
                  </Button>
                ))}
              </ButtonGroup>

              <div className="flex gap-2">
                {enableDraftOrders && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={onHold}
                    disabled={holding || !hasItems}
                    className="h-11 flex-1 rounded-lg text-sm"
                  >
                    {holding
                      ? "Menahan..."
                      : resumingDraftId
                        ? "Perbarui Draft"
                        : "Tahan"}
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !hasItems}
                  className="h-11 flex-1 rounded-lg text-sm"
                >
                  {submitting ? "Memproses..." : `Bayar ${rupiah(total)}`}
                </Button>
              </div>

              {canPrintLast && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={onPrintLast}
                  className="h-9 w-full rounded-lg"
                >
                  Cetak Struk Terakhir
                </Button>
              )}
            </div>
          </form>
        </div>
    </aside>
  );
}
