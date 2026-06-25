"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import type { MenuCategory } from "@/lib/menu";
import { submitQrOrder } from "./actions";
import { useCart } from "./use-cart";
import { MenuList } from "./menu-list";
import { CartSheet } from "./cart-sheet";
import { ConfirmStep } from "./confirm-step";
import { CheckoutStep } from "./checkout-step";
import { OrderSuccess } from "./order-success";
import type { PaymentMethod, Stage } from "./types";

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
  const cart = useCart({ taxRate, taxEnabled });
  const [stage, setStage] = useState<Stage>("menu");
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneStatus, setDoneStatus] = useState<string | null>(null);

  function handleSubmit(data: {
    name: string;
    phone: string;
    paymentMethod: PaymentMethod;
  }) {
    setSubmitting(true);
    submitQrOrder({
      tableId,
      customerName: data.name,
      customerPhone: data.phone,
      paymentMethod: data.paymentMethod,
      lines: cart.cart.map((c) => ({
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
      <OrderSuccess
        status={doneStatus}
        tableNumber={tableNumber}
        qrisImageUrl={qrisImageUrl}
      />
    );
  }

  if (stage === "confirm") {
    return (
      <div className="mx-auto max-w-md">
        <ConfirmStep
          cart={cart.cart}
          subtotal={cart.subtotal}
          tax={cart.tax}
          taxRate={taxRate}
          total={cart.total}
          onBack={() => setStage("menu")}
          onContinue={() => setStage("checkout")}
        />
      </div>
    );
  }

  if (stage === "checkout") {
    return (
      <div className="mx-auto max-w-md">
        <CheckoutStep
          subtotal={cart.subtotal}
          tax={cart.tax}
          taxRate={taxRate}
          total={cart.total}
          submitting={submitting}
          onBack={() => setStage("confirm")}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-28">
      <header className="sticky top-0 z-10 border-b bg-background p-4">
        <h1 className="text-lg font-semibold">{storeName}</h1>
        <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
      </header>

      <div className="p-4">
        <MenuList
          menu={menu}
          cart={cart.cart}
          onAdd={cart.addItem}
          onChangeQty={cart.changeQty}
        />
      </div>

      {cart.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-background p-4">
          <Button className="w-full" onClick={() => setCartOpen(true)}>
            Lihat Keranjang ({cart.itemCount}) — {rupiah(cart.total)}
          </Button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart.cart}
        subtotal={cart.subtotal}
        tax={cart.tax}
        taxRate={taxRate}
        total={cart.total}
        onChangeQty={cart.changeQty}
        onSetNote={cart.setNote}
        onContinue={() => {
          setCartOpen(false);
          setStage("confirm");
        }}
      />
    </div>
  );
}
