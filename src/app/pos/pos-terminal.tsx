"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { submitPosOrder } from "./actions";
import type { MenuCategory } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt, type ReceiptData, type ReceiptStore } from "@/components/receipt";

type CartItem = {
  itemId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  note: string;
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export function PosTerminal({
  menu,
  cashierName,
  store,
  taxRate,
  taxEnabled,
}: {
  menu: MenuCategory[];
  cashierName: string;
  store: ReceiptStore;
  taxRate: number;
  taxEnabled: boolean;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = taxEnabled ? Math.round(afterDiscount * (taxRate / 100)) : 0;
  const total = afterDiscount + tax;
  const change = paymentMethod === "CASH" ? Math.max(0, paidAmount - total) : 0;

  const cartQtyById = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cart) m.set(c.itemId, c.quantity);
    return m;
  }, [cart]);

  const visibleItems = useMemo(() => {
    const cats =
      activeCategory === "all"
        ? menu
        : menu.filter((c) => c.id === activeCategory);
    return cats.flatMap((cat) =>
      cat.items
        .filter((i) => i.isAvailable)
        .map((i) => ({ ...i, categoryName: cat.name }))
    );
  }, [menu, activeCategory]);

  function addItem(item: MenuCategory["items"][number]) {
    if (!item.isAvailable || item.stock < 1) {
      toast.error("Item tidak tersedia");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error("Stok tidak cukup");
          return prev;
        }
        return prev.map((c) =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          price: item.price,
          stock: item.stock,
          quantity: 1,
          note: "",
        },
      ];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.itemId !== itemId) return [c];
        const next = c.quantity + delta;
        if (next < 1) return [];
        if (next > c.stock) {
          toast.error("Stok tidak cukup");
          return [c];
        }
        return [{ ...c, quantity: next }];
      })
    );
  }

  function setNote(itemId: string, note: string) {
    setCart((prev) =>
      prev.map((c) => (c.itemId === itemId ? { ...c, note } : c))
    );
  }

  function reset() {
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setCustomerName("");
    setOrderType("DINE_IN");
    setPaymentMethod("CASH");
  }

  function handleSubmit() {
    if (!cart.length) {
      toast.error("Keranjang kosong");
      return;
    }
    if (paymentMethod === "CASH" && paidAmount < total) {
      toast.error("Jumlah bayar kurang");
      return;
    }
    setSubmitting(true);
    submitPosOrder({
      lines: cart.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
        note: c.note || undefined,
      })),
      type: orderType,
      paymentMethod,
      discount,
      paidAmount: paymentMethod === "CASH" ? paidAmount : total,
      customerName: customerName || undefined,
    }).then((res) => {
      setSubmitting(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const paid = paymentMethod === "CASH" ? paidAmount : total;
      setLastReceipt({
        id: res.orderId,
        transactionDate: new Date().toISOString(),
        cashierName,
        customerName: customerName || null,
        tableNumber: null,
        type: orderType,
        paymentMethod,
        items: cart.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price,
        })),
        subtotal,
        discount,
        tax,
        total,
        paidAmount: paid,
        changeAmount: paymentMethod === "CASH" ? Math.max(0, paid - total) : 0,
      });
      toast.success("Transaksi berhasil");
      reset();
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {menu.length === 0 ? (
          <p className="p-4 text-muted-foreground">
            Belum ada menu. Tambahkan item di halaman Menu.
          </p>
        ) : (
          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v ?? "all")}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="border-b px-3 py-2">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Semua</TabsTrigger>
                {menu.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleItems.map((item) => {
                  const inCart = cartQtyById.get(item.id) ?? 0;
                  const remaining = item.stock - inCart;
                  return (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      disabled={remaining < 1}
                      className="group flex flex-col overflow-hidden rounded-lg border text-left transition-colors hover:border-primary disabled:opacity-50"
                    >
                      <div className="relative aspect-square w-full bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                            className="object-cover"
                          />
                        ) : null}
                        {inCart > 0 && (
                          <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                            {inCart}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col p-1.5">
                        <span className="line-clamp-1 text-sm font-medium leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {rupiah(item.price)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Sisa: {remaining}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Tabs>
        )}
      </div>

      <aside className="flex w-80 shrink-0 flex-col border-l">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="font-semibold">Keranjang</span>
          {cart.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {cart.reduce((s, c) => s + c.quantity, 0)} item
            </span>
          )}
        </div>
        <div className="flex-1 overflow-auto p-2">
          {cart.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Keranjang kosong</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cart.map((c) => (
                <div key={c.itemId} className="rounded-md border p-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {c.name}
                    </span>
                    <span className="text-sm whitespace-nowrap">
                      {rupiah(c.price * c.quantity)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => changeQty(c.itemId, -1)}
                    >
                      -
                    </Button>
                    <span className="w-5 text-center text-sm">{c.quantity}</span>
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => changeQty(c.itemId, 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Input
                    placeholder="Catatan…"
                    value={c.note}
                    onChange={(e) => setNote(c.itemId, e.target.value)}
                    className="mt-1.5 h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer">Nama Pelanggan (opsional)</Label>
            <Input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label>Tipe</Label>
              <Select
                value={orderType}
                onValueChange={(v) => setOrderType(v as typeof orderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="DINE_IN">Dine In</SelectItem>
                    <SelectItem value="TAKE_AWAY">Take Away</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Bayar</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="QRIS">QRIS</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="discount">Diskon (Rp)</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
          {paymentMethod === "CASH" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="paid">Jumlah Bayar (Rp)</Label>
              <Input
                id="paid"
                type="number"
                min={0}
                value={paidAmount || ""}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{rupiah(discount)}</span>
              </div>
            )}
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
            {paymentMethod === "CASH" && paidAmount > 0 && (
              <div className="flex justify-between">
                <span>Kembali</span>
                <span>{rupiah(change)}</span>
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !cart.length}>
            {submitting ? "Memproses..." : "Bayar & Simpan"}
          </Button>
          {lastReceipt && (
            <Button variant="outline" onClick={() => handlePrint()}>
              Cetak Struk Terakhir
            </Button>
          )}
        </div>
      </aside>

      <div className="hidden">
        {lastReceipt && (
          <Receipt ref={receiptRef} data={lastReceipt} store={store} />
        )}
      </div>
    </div>
  );
}
