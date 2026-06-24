import { requireRole } from "@/lib/session";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { PosHeader } from "./pos-header";
import { PosTerminal, type DraftOrder } from "./pos-terminal";
import { CashierProvider } from "./cashier-context";
import { DraftsUIProvider } from "./drafts-ui-context";

export default async function PosPage() {
  const session = await requireRole("CASHIER");
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);

  let drafts: DraftOrder[] = [];
  if (settings.enableDraftOrders) {
    const rows = await prisma.order.findMany({
      where: { cashierId: session.user.id, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    drafts = rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      customerName: o.customerName,
      note: o.note,
      total: o.total,
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
          />
        </DraftsUIProvider>
      </CashierProvider>
    </div>
  );
}
