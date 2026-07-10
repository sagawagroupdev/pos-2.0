"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MenuCategory } from "@/lib/menu";
import { submitQrOrder } from "./actions";
import { useCart } from "./use-cart";
import { MenuList } from "./menu-list";
import { CartBar } from "./cart-bar";
import { CartSheet } from "./cart-sheet";
import { ConfirmStep } from "./confirm-step";
import { CheckoutStep } from "./checkout-step";
import { OrderSuccess } from "./order-success";
import type { OrderType, PaymentMethod, Stage } from "./types";
import Image from "next/image";

export function CustomerOrder({
  tableId,
  tableNumber,
  outletAddress,
  menu,
  storeName,
  taxRate,
  taxEnabled,
  qrisImageUrl,
}: {
  tableId: string;
  tableNumber: string;
  outletAddress: string | null;
  menu: MenuCategory[];
  storeName: string;
  taxRate: number;
  taxEnabled: boolean;
  qrisImageUrl: string | null;
}) {
  const cart = useCart({ taxRate, taxEnabled });
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [stage, setStage] = useState<Stage>("orderType");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneStatus, setDoneStatus] = useState<string | null>(null);

  function navigate(next: Stage) {
    setDirection("forward");
    setStage(next);
  }

  function navigateBack(prev: Stage) {
    setDirection("backward");
    setStage(prev);
  }

  function handleOrderAgain() {
    cart.clearCart();
    setDoneStatus(null);
    navigate("menu");
  }

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
      type: orderType,
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
      cart.clearCart();
      setDoneStatus(res.status);
      navigate("done");
    });
  }

  if (stage === "done") {
    return (
      <div key="done" className="animate-in slide-in-from-right duration-300">
        <OrderSuccess
          status={doneStatus}
          tableNumber={tableNumber}
          qrisImageUrl={qrisImageUrl}
          onOrderAgain={handleOrderAgain}
        />
      </div>
    );
  }

  if (stage === "confirm") {
    return (
      <div
        key="confirm"
        className={`animate-in duration-300 ${
          direction === "forward"
            ? "slide-in-from-right"
            : "slide-in-from-left"
        }`}
      >
        <div className="mx-auto max-w-md">
          <ConfirmStep
            cart={cart.cart}
            subtotal={cart.subtotal}
            tax={cart.tax}
            taxRate={taxRate}
            total={cart.total}
            onBack={() => navigateBack("menu")}
            onContinue={() => navigate("checkout")}
          />
        </div>
      </div>
    );
  }

  if (stage === "checkout") {
    return (
      <div
        key="checkout"
        className={`animate-in duration-300 ${
          direction === "forward"
            ? "slide-in-from-right"
            : "slide-in-from-left"
        }`}
      >
        <div className="mx-auto max-w-md">
          <CheckoutStep
            subtotal={cart.subtotal}
            tax={cart.tax}
            taxRate={taxRate}
            total={cart.total}
            submitting={submitting}
            onBack={() => navigateBack("confirm")}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  // Order type selection
  if (stage === "orderType") {
    return (
      <div
        key="orderType"
        className="animate-in slide-in-from-right duration-300"
      >
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-4">
          <div className="pointer-events-none absolute inset-x-0 -top-5 -left-5  -right-5 -z-10 h-67 rounded-b-full bg-primary blur-md" />
          <div className="-mx-8 w-[calc(100%+4rem)] overflow-hidden rounded-b-3xl">
            <Image
              src="/assets/element/menus-vektor.svg"
              alt=""
              width={240}
              height={220}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <p className="text-center text-base font-semibold">
            Pilih jenis pesanan Anda
          </p>
          <p className="-mt-2 text-center text-xs text-muted-foreground">
            Meja {tableNumber}
          </p>
          <div className="flex w-full flex-col items-center gap-4">
            <button
              onClick={() => { setOrderType("DINE_IN"); navigate("menu"); }}
              className={`relative flex w-72 cursor-pointer items-center rounded-full border bg-white/10 py-2.5 pl-3 pr-6 backdrop-blur-xl transition-all hover:bg-white/20 active:scale-[0.97] ${
                orderType === "DINE_IN"
                  ? "border-emerald-400"
                  : "border-slate-400/20"
              }`}
            >
              <Image
                src="/assets/icon/dine-in.svg"
                alt=""
                width={40}
                height={40}
                className="shrink-0"
              />
              {(orderType === "DINE_IN") && (
                <svg className="absolute right-3 h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className="flex-1 text-center text-sm font-semibold">Dine In</span>
            </button>
            <button
              onClick={() => { setOrderType("TAKE_AWAY"); navigate("menu"); }}
              className={`relative flex w-72 cursor-pointer items-center rounded-full border bg-white/10 py-2.5 pl-3 pr-6 backdrop-blur-xl transition-all hover:bg-white/20 active:scale-[0.97] ${
                orderType === "TAKE_AWAY"
                  ? "border-emerald-400"
                  : "border-slate-400/20"
              }`}
            >
              <Image
                src="/assets/icon/take-away.svg"
                alt=""
                width={40}
                height={40}
                className="shrink-0"
              />
              {(orderType === "TAKE_AWAY") && (
                <svg className="absolute right-3 h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className="flex-1 text-center text-sm font-semibold">Take Away</span>
            </button>
          </div>
          <p className="mt-auto pb-2 text-center text-xs text-muted-foreground">
            Powered by Sagawa POS
          </p>
        </div>
      </div>
    );
  }

  // Menu stage
  return (
    <div
      key="menu"
      className={`animate-in duration-300 ${
        direction === "forward" ? "slide-in-from-right" : "slide-in-from-left"
      }`}
    >
      <div className="mx-auto max-w-md pb-28">
        {/* Store info — not sticky */}
        <div className="flex items-start gap-3 border-b bg-background p-4">
          <button
            onClick={() => navigateBack("orderType")}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold">{storeName}</h1>
            {outletAddress && (
              <p className="text-xs text-muted-foreground">{outletAddress}</p>
            )}
          </div>
        </div>

        {/* Table number + order type — sticky centered */}
        <div className="sticky top-0 z-20 border-b bg-background/80 py-2 text-center backdrop-blur-sm">
          <div className="text-lg font-semibold">Meja {tableNumber}</div>
          <div className="text-xs text-muted-foreground">
            {orderType === "DINE_IN" ? "Makan di Tempat" : "Bungkus"}
          </div>
        </div>

        <div className="p-4">
          <MenuList
            menu={menu}
            cart={cart.cart}
            onAdd={cart.addItem}
            onChangeQty={cart.changeQty}
          />
        </div>

        <CartBar
          itemCount={cart.itemCount}
          total={cart.total}
          onOpenCart={() => setCartOpen(true)}
        />

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
            navigate("confirm");
          }}
        />
      </div>
    </div>
  );
}
