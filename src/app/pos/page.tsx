import { requireRole } from "@/lib/session";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { PosHeader } from "./pos-header";
import { PosTerminal, type DraftOrder } from "./pos-terminal";
import { CashierProvider } from "./cashier-context";
import { DraftsUIProvider } from "./drafts-ui-context";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>;
}) {
  const session = await requireRole("CASHIER");
  const [menu, settings, { resume }] = await Promise.all([
    getMenu(),
    getSettings(),
    searchParams,
  ]);

  let drafts: DraftOrder[] = [];
  if (settings.enableDraftOrders) {
    const rows = await prisma.order.findMany({
      where: {
        cashierId: session.user.id,
        // Cashier holds only — these were created with skipStock, so no stock
        // is reserved. QR orders (which reserved stock) are handled in the
        // Orders Dashboard via confirm/cancel instead.
        channel: "CASHIER",
        status: {
          in: ["DRAFT", "PENDING", "PENDING_PAYMENT", "WAITING_CONFIRMATION"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    drafts = rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: o.status as DraftOrder["status"],
      channel: o.channel,
      paymentMethod: o.paymentMethod,
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
          <PosHeader storeName={settings.storeName} cashierId={session.user.id} />
          <PosTerminal
            menu={menu}
            store={{
              storeName: settings.storeName,
              address: settings.address,
              phone: settings.phone,
              receiptFooter: settings.receiptFooter,
            }}
            taxRate={settings.taxRate}
            taxEnabled={settings.taxEnabled}
            enableDraftOrders={settings.enableDraftOrders}
            drafts={drafts}
            resumeId={resume ?? null}
          />
        </DraftsUIProvider>
      </CashierProvider>
    </div>
  );
}
