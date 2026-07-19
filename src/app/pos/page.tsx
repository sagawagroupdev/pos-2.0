import { requireRole } from "@/lib/session";
import { getMenu } from "@/lib/menu";
import { getSettings, getCashierOutlet } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { getLockedQrCheckout } from "@/lib/qr-checkout";
import { PosHeader } from "./pos-header";
import {
  PosTerminal,
  type DraftOrder,
  type QrCheckoutSnapshot,
} from "./pos-terminal";
import { CashierProvider } from "./cashier-context";
import { DraftsUIProvider } from "./drafts-ui-context";
import { QrOrderSheetUIProvider } from "./qr-order-sheet-ui-context";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string; checkout?: string }>;
}) {
  const session = await requireRole("CASHIER");
  const [menu, settings, outlet, { resume, checkout }] = await Promise.all([
    getMenu(),
    getSettings(),
    getCashierOutlet(session.user.id),
    searchParams,
  ]);

  let qrCheckout: QrCheckoutSnapshot | null = null;
  let checkoutError: string | null = null;
  if (checkout) {
    qrCheckout = await getLockedQrCheckout({
      checkoutLockToken: checkout,
      cashierId: session.user.id,
    });
    if (!qrCheckout) {
      checkoutError = "Checkout QR tidak tersedia atau kuncinya kedaluwarsa.";
    }
  }

  let drafts: DraftOrder[] = [];
  if (settings.enableDraftOrders) {
    const rows = await prisma.order.findMany({
      where: {
        cashierId: session.user.id,
        channel: "CASHIER",
        status: "DRAFT",
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    drafts = rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: "DRAFT",
      channel: o.channel,
      paymentMethod: o.paymentMethod ?? "CASH",
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      tableNumber: o.tableNumber,
      note: o.note,
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      total: o.total,
      paidAmount: o.paidAmount,
      changeAmount: o.changeAmount,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        itemId: it.itemId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        note: it.note,
      })),
    }));
  }

  return (
    <div className="flex h-screen flex-col">
      <CashierProvider defaultName={session.user.name}>
        <DraftsUIProvider
          enabled={settings.enableDraftOrders}
          count={drafts.length}
        >
          <QrOrderSheetUIProvider>
            <PosHeader storeName={outlet.outletName} cashierId={session.user.id} />
            <PosTerminal
            menu={menu}
            store={{
              storeName: outlet.outletName,
              address: outlet.outletAddress,
              phone: outlet.outletPhone,
              receiptFooter: settings.receiptFooter,
            }}
            taxRate={settings.taxRate}
            taxEnabled={settings.taxEnabled}
            enableDraftOrders={settings.enableDraftOrders}
            drafts={drafts}
            resumeId={resume ?? null}
            qrCheckout={qrCheckout}
            checkoutLockToken={qrCheckout ? checkout ?? null : null}
            checkoutError={checkoutError}
          />
          </QrOrderSheetUIProvider>
        </DraftsUIProvider>
      </CashierProvider>
    </div>
  );
}
