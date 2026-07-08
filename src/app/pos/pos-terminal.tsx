"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { gooeyToast } from "gooey-toast";
import { submitPosOrder, holdPosOrder } from "./actions";
import { useCashier } from "./cashier-context";
import { useDraftsUI } from "./drafts-ui-context";
import type { MenuCategory } from "@/lib/menu";
import { SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DraftSheet } from "./draft-sheet";
import { Receipt, type ReceiptData, type ReceiptStore } from "@/components/receipt";
import {
  CartPanel,
  type CartItem,
  type OrderType,
  type PaymentMethod,
} from "./cart-panel";
import { rupiah } from "@/lib/format";

export type DraftStatus =
  | "DRAFT"
  | "PENDING"
  | "PENDING_PAYMENT"
  | "WAITING_CONFIRMATION";

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
}: {
  menu: MenuCategory[];
  store: ReceiptStore;
  taxRate: number;
  taxEnabled: boolean;
  enableDraftOrders: boolean;
  drafts: DraftOrder[];
  resumeId: string | null;
}) {
  const router = useRouter();
  const { cashierName } = useCashier();
  const { open: draftsOpen, setOpen: setDraftsOpen } = useDraftsUI();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [resumingDraftId, setResumingDraftId] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [resumedId, setResumedId] = useState<string | null>(null);

  // Auto-load a draft when arriving via /pos?resume=<id> (from Orders Dashboard).
  if (resumeId && resumeId !== resumedId) {
    setResumedId(resumeId);
    const target = drafts.find((d) => d.id === resumeId);
    if (target) loadDraftIntoCart(target);
  }

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
      gooeyToast.error({ title: "Item tidak tersedia" });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          gooeyToast.error({ title: "Stok tidak cukup" });
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

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.itemId !== itemId) return [c];
        const next = c.quantity + delta;
        if (next < 1) return [];
        if (next > c.stock) {
          gooeyToast.error({ title: "Stok tidak cukup" });
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
    setNote("");
    setOrderType("DINE_IN");
    setPaymentMethod("CASH");
    setResumingDraftId(null);
  }

  function handleHold() {
    if (!cart.length) {
      gooeyToast.error({ title: "Keranjang kosong" });
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
        gooeyToast.error({ title: res.error });
        return;
      }
      gooeyToast.info({ title: "Pesanan ditahan" });
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

  function handleSubmit() {
    if (!cart.length) {
      gooeyToast.error({ title: "Keranjang kosong" });
      return;
    }
    if (!cashierName.trim()) {
      gooeyToast.error({ title: "Nama kasir wajib diisi" });
      return;
    }
    if (!customerName.trim()) {
      gooeyToast.error({ title: "Nama pelanggan wajib diisi" });
      return;
    }
    if (paymentMethod === "CASH" && paidAmount < total) {
      gooeyToast.error({ title: "Jumlah bayar kurang" });
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
      discount: discountAmount,
      paidAmount: paymentMethod === "CASH" ? paidAmount : total,
      customerName: customerName || undefined,
      cashierName: cashierName || undefined,
      note: note || undefined,
      resumingDraftId: resumingDraftId || undefined,
    }).then((res) => {
      setSubmitting(false);
      if (!res.ok) {
        gooeyToast.error({ title: res.error });
        return;
      }
      const paid = paymentMethod === "CASH" ? paidAmount : total;
      setLastReceipt({
        id: res.orderId,
        orderNumber: res.orderNumber,
        transactionDate: new Date().toISOString(),
        cashierName,
        customerName: customerName || null,
        tableNumber: null,
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
      });
      gooeyToast.info({ title: "Transaksi berhasil" });
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
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b px-3 py-2">
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
        onClear={reset}
        onSubmit={handleSubmit}
        onHold={handleHold}
        onPrintLast={() => handlePrint()}
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
          <Receipt ref={receiptRef} data={lastReceipt} store={store} />
        )}
      </div>
    </div>
  );
}
