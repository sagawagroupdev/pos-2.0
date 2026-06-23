"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { submitQrOrder } from "./actions";
import type { MenuCategory } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type Stage = "menu" | "checkout" | "done";

export function CustomerOrder({
  tableId,
  tableNumber,
  menu,
  storeName,
  taxRate,
  taxEnabled,
  qrisImageUrl,
}: {
  tableId: string;
  tableNumber: string;
  menu: MenuCategory[];
  storeName: string;
  taxRate: number;
  taxEnabled: boolean;
  qrisImageUrl: string | null;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stage, setStage] = useState<Stage>("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [doneStatus, setDoneStatus] = useState<string | null>(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );
  const tax = taxEnabled ? Math.round(subtotal * (taxRate / 100)) : 0;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  function addItem(item: MenuCategory["items"][number]) {
    if (!item.isAvailable || item.stock < 1) return;
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
    setCart((prev) => prev.map((c) => (c.itemId === itemId ? { ...c, note } : c)));
  }

  function handleSubmit() {
    if (!name.trim() || phone.trim().length < 6) {
      toast.error("Lengkapi nama dan no. telepon");
      return;
    }
    setSubmitting(true);
    submitQrOrder({
      tableId,
      customerName: name,
      customerPhone: phone,
      paymentMethod,
      lines: cart.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
        note: c.note || undefined,
      })),
    }).then((res) => {
      setSubmitting(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDoneStatus(res.status);
      setStage("done");
    });
  }

  if (stage === "done") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Pesanan Terkirim</h1>
        {doneStatus === "PENDING_PAYMENT" ? (
          <p className="text-muted-foreground">
            Pesanan telah diterima. Silakan menuju kasir untuk melakukan
            pembayaran tunai.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground">
              Silakan lakukan pembayaran QRIS, lalu tekan tombol di bawah. Kasir
              akan mengkonfirmasi pembayaran Anda.
            </p>
            {qrisImageUrl && (
              <Image
                src={qrisImageUrl}
                alt="QRIS"
                width={240}
                height={240}
                className="size-60 object-contain"
              />
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="sticky top-0 z-10 border-b bg-background p-4">
        <h1 className="text-lg font-semibold">{storeName}</h1>
        <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
      </header>

      <div className="flex flex-col gap-6 p-4">
        {menu.length === 0 ? (
          <p className="text-muted-foreground">Menu belum tersedia.</p>
        ) : (
          menu.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2">
              <h2 className="font-semibold">{cat.name}</h2>
              {cat.items
                .filter((i) => i.isAvailable)
                .map((item) => {
                  const inCart = cart.find((c) => c.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="size-14 rounded object-cover"
                        />
                      ) : (
                        <div className="size-14 rounded bg-muted" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                        <div className="text-sm">{rupiah(item.price)}</div>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeQty(item.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-5 text-center">
                            {inCart.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeQty(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          disabled={item.stock < 1}
                          onClick={() => addItem(item)}
                        >
                          Tambah
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          ))
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-background p-4">
          <Button className="w-full" onClick={() => setStage("checkout")}>
            Lihat Keranjang ({itemCount}) — {rupiah(total)}
          </Button>
        </div>
      )}

      <Dialog
        open={stage === "checkout"}
        onOpenChange={(o) => !o && setStage("menu")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>
              Periksa pesanan dan lengkapi data Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-60 flex-col gap-2 overflow-auto">
            {cart.map((c) => (
              <div key={c.itemId} className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span>{rupiah(c.price * c.quantity)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeQty(c.itemId, -1)}
                  >
                    -
                  </Button>
                  <span className="w-5 text-center">{c.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeQty(c.itemId, 1)}
                  >
                    +
                  </Button>
                </div>
                <Input
                  placeholder="Catatan (opsional)"
                  value={c.note}
                  onChange={(e) => setNote(c.itemId, e.target.value)}
                  className="mt-2"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t pt-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cust-name">Nama</Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cust-phone">No. Telepon</Label>
              <Input
                id="cust-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Metode Pembayaran</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "CASH" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentMethod("CASH")}
                >
                  Tunai (di Kasir)
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "QRIS" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentMethod("QRIS")}
                >
                  QRIS
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>
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
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Mengirim..." : "Kirim Pesanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
