"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Lottie from "lottie-react";
import { toast } from "sonner";
import {
  submitPosOrder,
  holdPosOrder,
  releaseQrCheckoutAction,
  settleQrCheckoutAction,
} from "./actions";
import { useCashier } from "./cashier-context";
import { useDraftsUI } from "./drafts-ui-context";
import { useQrOrderSheetUI } from "./qr-order-sheet-ui-context";
import { usePrinter } from "./printer-context";
import type { MenuCategory } from "@/lib/menu";
import { SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DraftSheet } from "./draft-sheet";
import { QrOrderSheet } from "./qr-order-sheet";
import { QrOrderScannerDialog } from "./qr-order-scanner-dialog";
import { listQrOrdersAction } from "./actions";
import type { QrOrderListItem } from "./actions";
import { buildReceipt } from "@/lib/escpos-receipt";
import successAnimation from "../../../public/assets/lottie/Success.json";
import {
  CartPanel,
  type CartItem,
  type OrderType,
  type PaymentMethod,
} from "./cart-panel";
import { Receipt58mm, type Receipt58mmData } from "@/components/receipt";
import { rupiah } from "@/lib/format";

export type DraftStatus =
  | "DRAFT";

export type QrCheckoutSnapshot = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  tableNumber: string | null;
  type: OrderType;
  requestedPaymentMethod: PaymentMethod | null;
  note: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: {
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    note: string | null;
  }[];
};

export type DraftItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string | null;
};

export type DraftOrder = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: DraftStatus;
  channel: "CASHIER" | "QR";
  paymentMethod: PaymentMethod;
  customerName: string | null;
  customerPhone: string | null;
  tableNumber: string | null;
  note: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  createdAt: string;
  items: DraftItem[];
};

export function PosTerminal({
  menu,
  store,
  taxRate,
  taxEnabled,
  enableDraftOrders,
  drafts,
  resumeId,
  qrCheckout,
  checkoutLockToken,
  checkoutError,
}: {
  menu: MenuCategory[];
  store: Receipt58mmStore;
  taxRate: number;
  taxEnabled: boolean;
  enableDraftOrders: boolean;
  drafts: DraftOrder[];
  resumeId: string | null;
  qrCheckout: QrCheckoutSnapshot | null;
  checkoutLockToken: string | null;
  checkoutError: string | null;
}) {
  const router = useRouter();
  const { cashierName } = useCashier();
  const { open: draftsOpen, setOpen: setDraftsOpen } = useDraftsUI();
  const printer = usePrinter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt58mmData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [resumingDraftId, setResumingDraftId] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [connectingPrinter, setConnectingPrinter] = useState(false);
  const [releasingQrCheckout, startReleaseQrCheckout] = useTransition();
  const { open: qrOrderSheetOpen, setOpen: setQrOrderSheetOpen } = useQrOrderSheetUI();
  const [qrOrders, setQrOrders] = useState<QrOrderListItem[]>([]);

  // Auto-load a draft when arriving via /pos?resume=<id> (from Orders Dashboard).
  const prevResumeId = useRef<string | null>(null);
  useEffect(() => {
    if (!resumeId || resumeId === prevResumeId.current) return;
    prevResumeId.current = resumeId;
    const target = drafts.find((d) => d.id === resumeId);
    if (target) loadDraftIntoCart(target);
  }, [resumeId, drafts]);

  // Auto-load QR checkout items into cart when claimed.
  useEffect(() => {
    if (!qrCheckout) return;
    setCart(
      qrCheckout.items.map((it) => ({
        itemId: it.itemId,
        name: it.name,
        price: it.price,
        stock: Number.MAX_SAFE_INTEGER,
        quantity: it.quantity,
        note: it.note ?? "",
        image: null,
      }))
    );
    if (qrCheckout.customerName) setCustomerName(qrCheckout.customerName);
    if (qrCheckout.note) setNote(qrCheckout.note);
    if (qrCheckout.tableNumber) setTableNumber(qrCheckout.tableNumber);
    setOrderType(qrCheckout.type);
    if (qrCheckout.requestedPaymentMethod) setPaymentMethod(qrCheckout.requestedPaymentMethod);
  }, [qrCheckout, checkoutLockToken]);

  // Fetch QR orders when sheet opens
  useEffect(() => {
    if (qrOrderSheetOpen) {
      listQrOrdersAction().then((res) => {
        if (res.ok) setQrOrders(res.orders);
      });
    }
  }, [qrOrderSheetOpen]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = taxEnabled ? Math.round(afterDiscount * (taxRate / 100)) : 0;
  const total = afterDiscount + tax;
  const change = paymentMethod === "CASH" ? Math.max(0, paidAmount - total) : 0;
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

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
    const q = search.trim().toLowerCase();
    return cats.flatMap((cat) =>
      cat.items
        .filter((i) => i.isAvailable)
        .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
        .map((i) => ({ ...i, categoryName: cat.name }))
    );
  }, [menu, activeCategory, search]);

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
          image: item.image,
        },
      ];
    });
  }

  function setItemNote(itemId: string, note: string) {
    setCart((prev) =>
      prev.map((c) => (c.itemId === itemId ? { ...c, note } : c))
    );
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

  function reset() {
    setCart([]);
    setDiscountPercent(0);
    setPaidAmount(0);
    setCustomerName("");
    setTableNumber("");
    setNote("");
    setOrderType("DINE_IN");
    setPaymentMethod("CASH");
    setResumingDraftId(null);
  }

  function handleHold() {
    if (!cart.length) {
      toast.error("Keranjang kosong");
      return;
    }
    setHolding(true);
    holdPosOrder({
      lines: cart.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
        note: c.note || undefined,
      })),
      type: orderType,
      paymentMethod,
      discount: discountAmount,
      paidAmount: 0,
      customerName: customerName || undefined,
      cashierName: cashierName || undefined,
      note: note || undefined,
      resumingDraftId: resumingDraftId || undefined,
    }).then((res) => {
      setHolding(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Pesanan ditahan");
      reset();
      router.refresh();
    });
  }

  function loadDraftIntoCart(draft: DraftOrder) {
    setCart(
      draft.items.map((it) => ({
        itemId: it.itemId,
        name: it.name,
        price: it.price,
        stock: Number.MAX_SAFE_INTEGER,
        quantity: it.quantity,
        note: it.note ?? "",
        image: null,
      }))
    );
    setOrderType(draft.type);
    setPaymentMethod(draft.paymentMethod);
    setDiscountPercent(
      draft.subtotal > 0
        ? Math.round((draft.discount / draft.subtotal) * 100)
        : 0
    );
    setCustomerName(draft.customerName ?? "");
    setNote(draft.note ?? "");
    setResumingDraftId(draft.id);
  }

  function recallDraft(draft: DraftOrder) {
    loadDraftIntoCart(draft);
    setDraftsOpen(false);
  }

  function handleReleaseQrCheckout() {
    if (!checkoutLockToken || releasingQrCheckout) return;
    startReleaseQrCheckout(async () => {
      const result = await releaseQrCheckoutAction(checkoutLockToken);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Checkout QR dilepas");
      router.replace("/pos");
    });
  }

  // Print receipt via BLE — fire & forget, never blocks the submit flow
  function printToBle(data: Receipt58mmData) {
    if (!printer.connected) return;
    setPrinting(true);
    const bytes = buildReceipt(data, store);
    printer.print(bytes)
      .catch(() => {}) // silent fail — printing is best-effort
      .finally(() => setPrinting(false));
  }

  function buildReceiptData(
    id: string,
    orderNumber: string,
    paid: number,
  ): Receipt58mmData {
    return {
      id,
      orderNumber,
      transactionDate: new Date().toISOString(),
      cashierName,
      customerName: customerName || null,
      tableNumber: tableNumber || qrCheckout?.tableNumber || null,
      type: orderType,
      paymentMethod,
      note: note || null,
      items: cart.map((c) => ({
        name: c.name,
        quantity: c.quantity,
        price: c.price,
      })),
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paidAmount: paid,
      changeAmount: paymentMethod === "CASH" ? Math.max(0, paid - total) : 0,
    };
  }

  function handleSubmit() {
    if (!cart.length) {
      toast.error("Keranjang kosong");
      return;
    }
    if (!cashierName.trim()) {
      toast.error("Nama kasir wajib diisi");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    if (paymentMethod === "CASH" && paidAmount < total) {
      toast.error("Jumlah bayar kurang");
      return;
    }

    setSubmitting(true);

    const paid = paymentMethod === "CASH" ? paidAmount : total;

    function onSuccess(id: string, orderNumber: string) {
      const receipt = buildReceiptData(id, orderNumber, paid);
      setLastReceipt(receipt);
      setShowSuccess(true);
      setSubmitting(false);
      reset();

      // Print is fire-and-forget — doesn't block reset() or cause stuck state
      printToBle(receipt);
    }

    function onError(msg: string) {
      setSubmitting(false);
      toast.error(msg);
    }

    if (checkoutLockToken) {
      settleQrCheckoutAction({
        checkoutLockToken,
        lines: cart.map((c) => ({
          itemId: c.itemId,
          quantity: c.quantity,
          note: c.note || undefined,
        })),
        type: orderType,
        paymentMethod,
        paidAmount: paid,
        customerName: customerName || undefined,
        cashierName: cashierName,
        note: note || undefined,
        discount: discountAmount,
      })
        .then((res) => {
          if (!res.ok) { onError(res.error); return; }
          onSuccess(res.orderId, res.orderNumber);
          setTimeout(() => router.replace("/pos"), 2000);
        })
        .catch(() => {
          onError("Gagal memproses pembayaran");
        });
      return;
    }

    submitPosOrder({
      lines: cart.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
        note: c.note || undefined,
      })),
      type: orderType,
      paymentMethod,
      discount: discountAmount,
      paidAmount: paid,
      customerName: customerName || undefined,
      cashierName: cashierName || undefined,
      note: note || undefined,
      resumingDraftId: resumingDraftId || undefined,
    })
      .then((res) => {
        if (!res.ok) { onError(res.error); return; }
        onSuccess(res.orderId, res.orderNumber);
        router.refresh();
      })
      .catch(() => {
        onError("Gagal memproses pesanan");
      });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {checkoutError && (
          <div className="border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {checkoutError}
          </div>
        )}
        {qrCheckout && checkoutLockToken && (
          <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">QR Table checkout</p>
              <p className="truncate text-xs text-muted-foreground">
                {qrCheckout.orderNumber}
                {qrCheckout.customerName ? ` · ${qrCheckout.customerName}` : ""}
                {qrCheckout.tableNumber ? ` · Meja ${qrCheckout.tableNumber}` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={releasingQrCheckout}
              onClick={handleReleaseQrCheckout}
            >
              {releasingQrCheckout ? "Melepas..." : "Lepas kunci"}
            </Button>
          </div>
        )}
        {menu.length === 0 ? (
          <p className="p-4 text-muted-foreground">
            Belum ada menu. Tambahkan item di halaman Menu.
          </p>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b px-3 py-2">
              <QrOrderScannerDialog />
              <ScrollArea className="flex-1">
                <ButtonGroup>
                  <Button
                    variant={activeCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory("all")}
                  >
                    Semua
                  </Button>
                  {menu.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={activeCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </ButtonGroup>
              </ScrollArea>
              <div className="relative w-56 shrink-0">
                <SearchNormal1
                  size={16}
                  color="currentColor"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
            </ScrollArea>
          </div>
        )}
      </div>

      <CartPanel
        items={cart}
        itemCount={itemCount}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        tableNumber={tableNumber}
        onTableNumberChange={setTableNumber}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        note={note}
        onNoteChange={setNote}
        discountPercent={discountPercent}
        onDiscountPercentChange={setDiscountPercent}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        subtotal={subtotal}
        discountAmount={discountAmount}
        tax={tax}
        taxRate={taxRate}
        taxEnabled={taxEnabled}
        total={total}
        change={change}
        submitting={submitting}
        canPrintLast={!!lastReceipt}
        enableDraftOrders={enableDraftOrders}
        holding={holding}
        resumingDraftId={resumingDraftId}
        onChangeQty={changeQty}
        onSetNote={setItemNote}
        onClear={reset}
        onSubmit={handleSubmit}
        onHold={handleHold}
        onPrintLast={async () => {
          if (!lastReceipt) return;
          if (printer.connected) {
            setPrinting(true);
            try {
              const data = buildReceipt(lastReceipt, store);
              await printer.print(data);
              toast.success("Struk terkirim ke printer");
            } catch {
              toast.error("Gagal mencetak struk");
            }
            setPrinting(false);
          } else {
            handlePrint();
          }
        }}
      />

      <QrOrderSheet
        open={qrOrderSheetOpen}
        onOpenChange={setQrOrderSheetOpen}
        orders={qrOrders}
      />

      {enableDraftOrders && (
        <DraftSheet
          open={draftsOpen}
          onOpenChange={setDraftsOpen}
          drafts={drafts}
          onContinue={recallDraft}
        />
      )}

      <div className="hidden">
        {lastReceipt && (
          <Receipt58mm ref={receiptRef} data={lastReceipt} store={store} />
        )}
      </div>

      {/* Success overlay with Lottie animation */}
      {showSuccess && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-background p-8 text-center shadow-2xl">
            <Lottie
              animationData={successAnimation}
              loop={false}
              className="size-28"
            />
            <div>
              <h2 className="text-xl font-bold">Transaksi Berhasil!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lastReceipt.orderNumber}
              </p>
              <p className="mt-0.5 text-lg font-semibold text-primary">
                {rupiah(lastReceipt.total)}
              </p>
            </div>
            {printing && (
              <p className="text-xs text-muted-foreground">Mencetak struk...</p>
            )}
            {printer.connected && !printing && (
              <p className="text-xs text-emerald-600">Struk terkirim ke printer</p>
            )}
            {!printer.connected && (
              <p className="text-xs text-muted-foreground">
                Printer belum terhubung
              </p>
            )}
            <div className="flex gap-3">
              <Button onClick={() => setShowSuccess(false)} size="sm">
                Tutup
              </Button>
              {!printer.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={connectingPrinter}
                  onClick={async () => {
                    setConnectingPrinter(true);
                    try {
                      if (lastReceipt) {
                        setPrinting(true);
                        const data = buildReceipt(lastReceipt, store);
                        const printed = await printer.connectAndPrint(data);
                        if (printed) toast.success("Struk terkirim ke printer");
                      }
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Gagal mencetak struk"
                      );
                    } finally {
                      setPrinting(false);
                      setConnectingPrinter(false);
                    }
                  }}
                >
                  {connectingPrinter ? "Menghubungkan..." : "Connect Printer"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

