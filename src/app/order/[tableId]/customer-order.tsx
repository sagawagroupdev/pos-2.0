"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { MenuCategory } from "@/lib/menu";
import { submitQrOrder } from "./actions";
import { useCart } from "./use-cart";
import { MenuList } from "./menu-list";
import { CartBar } from "./cart-bar";
import { ConfirmStep } from "./confirm-step";
import { CheckoutStep } from "./checkout-step";
import { OrderSuccess } from "./order-success";
import type { OrderType, PaymentMethod, Stage} from "./types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { MenuSearch } from "./menu-search";
import { RippleButton } from "@/components/ui/ripple-button";
import { isOpenNow } from "@/lib/business-hours";
import type { BusinessHours } from "@/lib/business-hours";

export function CustomerOrder({
  tableId,
  tableNumber,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outletAddress: _outletAddress,
  menu,
  storeName,
  taxRate,
  taxEnabled,
  qrisImageUrl,
  businessHours,
}: {
  tableId: string;
  tableNumber: string;
  outletAddress?: string | null;
  menu: MenuCategory[];
  storeName: string;
  taxRate: number;
  taxEnabled: boolean;
  qrisImageUrl: string | null;
  businessHours?: string | null;
}) {
  const cart = useCart({ taxRate, taxEnabled });
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [stage, setStage] = useState<Stage>("orderType");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [submitting, setSubmitting] = useState(false);
  const [globalNote, setGlobalNote] = useState("");
  const [doneStatus, setDoneStatus] = useState<string | null>(null);
  const [doneCheckoutToken, setDoneCheckoutToken] = useState<string | null>(null);
  const [doneOrderNumber, setDoneOrderNumber] = useState<string | null>(null);
  const [donePaymentMethod, setDonePaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [outletRipple, setOutletRipple] = useState(0);
  const router = useRouter();

  const openCheck = useMemo(() => {
    if (!businessHours) return { open: true };
    try {
      return isOpenNow(JSON.parse(businessHours));
    } catch {
      return { open: true };
    }
  }, [businessHours]);

  const todayHours = useMemo(() => {
    if (!businessHours) return "";
    try {
      const h = JSON.parse(businessHours) as BusinessHours;
      const day = (new Date().getDay() || 7);
      const today = h[String(day)];
      if (!today || today.mode === "closed") return "Tutup Hari Ini";
      if (today.mode === "24h") return "00:00 - 23:59";
      return today.open && today.close ? `${today.open} - ${today.close}` : "";
    } catch { return ""; }
  }, [businessHours]);

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
    setDoneCheckoutToken(null);
    navigate("menu");
  }

  function handleSubmit(data: {
    name: string;
    phone: string;
    email: string;
    paymentMethod: PaymentMethod;
  }) {
    setSubmitting(true);
    submitQrOrder({
      tableId,
      customerName: data.name,
      customerPhone: data.phone || undefined,
      customerEmail: data.email || undefined,
      paymentMethod: data.paymentMethod,
      type: orderType,
      note: globalNote || undefined,
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
      setDoneCheckoutToken(res.checkoutToken);
      setDoneOrderNumber(res.orderNumber);
      setDonePaymentMethod(data.paymentMethod);
      navigate("done");
    });
  }

  if (!openCheck.open) {
    return (
      <div className="relative min-h-dvh">
        <Image
          src="/assets/img/closed-bg.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center text-white">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-lg font-semibold">Maaf Kami Sedang Tutup</p>
          <p className="text-sm opacity-80">{openCheck.message ?? "Silakan kembali saat jam operasional."}</p>
          <p className="absolute bottom-4 text-xs opacity-60">Powered by Sagawa POS</p>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div key="done" className="animate-in slide-in-from-right duration-300">
        <OrderSuccess
          checkoutToken={doneCheckoutToken}
          orderNumber={doneOrderNumber}
          status={doneStatus}
          paymentMethod={donePaymentMethod}
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
            orderType={orderType}
            menu={menu}
            cart={cart.cart}
            subtotal={cart.subtotal}
            tax={cart.tax}
            taxRate={taxRate}
            total={cart.total}
            globalNote={globalNote}
            onChangeQty={cart.changeQty}
            onSetNote={cart.setNote}
            onAddItem={cart.addItem}
            onGlobalNoteChange={setGlobalNote}
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
            tableNumber={tableNumber}
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
        <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 overflow-x-hidden p-4">
          <div className="pointer-events-none absolute inset-x-0 -top-5 -left-5  -right-5 -z-10 h-67 rounded-b-full bg-primary blur-md" />
          <div className="-mx-8 w-[calc(100%+4rem)] overflow-hidden rounded-b-3xl">
            <Image
              src="/assets/element/menus-vektor.svg"
              alt=""
              loading="eager"
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
            <RippleButton
              onClick={() => { setOrderType("DINE_IN"); navigate("menu"); }}
              className={`relative flex w-72 items-center rounded-full border bg-white/10 py-2.5 pl-3 pr-6 backdrop-blur-xl transition-all hover:bg-white/20 active:scale-[0.97] ${
                orderType === "DINE_IN"
                  ? "border-emerald-400"
                  : "border-slate-400/20"
              }`}
            >
              <Image
                src="/assets/icon/dine-in.svg"
                alt=""
                loading="eager"
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
            </RippleButton>
            <RippleButton
              onClick={() => { setOrderType("TAKE_AWAY"); navigate("menu"); }}
              className={`relative flex w-72 items-center rounded-full border bg-white/10 py-2.5 pl-3 pr-6 backdrop-blur-xl transition-all hover:bg-white/20 active:scale-[0.97] ${
                orderType === "TAKE_AWAY"
                  ? "border-emerald-400"
                  : "border-slate-400/20"
              }`}
            >
              <Image
                src="/assets/icon/take-away.svg"
                alt=""
                loading="eager"
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
            </RippleButton>
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
        <div className="overflow-x-hidden">
        {/* Banner + Outlet identity card */}
        <div className="relative">
          <div className="relative h-32 overflow-hidden">
            <Image
              src="/assets/img/bg-header.webp"
              fill
              alt=""
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 z-10">
              <RippleButton
                onClick={() => navigateBack("orderType")}
                className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
              </RippleButton>
            </div>
            <MenuSearch
              menu={menu}
              cart={cart.cart}
              onAdd={cart.addItem}
              onChangeQty={cart.changeQty}
            />
          </div>
          <button
            onClick={() => { setOutletRipple((k) => k + 1); router.push(`/order/${tableId}/outlet`); }}
            className="relative -mt-8 mx-4 flex w-[calc(100%-2rem)] cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-white px-5 py-4 shadow-md shadow-black/15 transition-shadow hover:shadow-lg"
          >
            {outletRipple > 0 && (
              <span
                key={outletRipple}
                className="pointer-events-none absolute inset-0 animate-[ripple_0.5s_ease-out] rounded-xl bg-black/10"
                onAnimationEnd={() => setOutletRipple(0)}
              />
            )}
            <div>
              <h1 className="text-base font-semibold text-foreground">{storeName}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {todayHours === "Tutup Hari Ini"
                  ? "Tutup Hari Ini"
                  : todayHours
                    ? `Buka hari ini • ${todayHours}`
                    : ""}
              </p>
            </div>
            <HugeiconsIcon icon={ArrowRight01Icon} size="16" color="currentColor" strokeWidth={1.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </button>
        </div>

        <div className="h-6" />

        </div>

        {/* Table number */}
        <div className="sticky top-0 z-30 flex items-center border-y bg-background/80 py-2 px-4 backdrop-blur-sm">
          <div className="flex-1 text-center">
            <div className="text-md font-semibold">Meja {tableNumber}</div>
            <div className="text-xs text-muted-foreground">
              {orderType === "DINE_IN" ? "Dine In" : "Take Away"}
            </div>
          </div>
        </div>

        <div className="p-2">
          <MenuList
            menu={menu}
            cart={cart.cart}
            onAdd={cart.addItem}
            onChangeQty={cart.changeQty}
            onSetNote={cart.setNote}
          />
        </div>

        <CartBar
          itemCount={cart.itemCount}
          total={cart.total}
          onOpenCart={() => navigate("confirm")}
        />
      </div>
    </div>
  );
}
