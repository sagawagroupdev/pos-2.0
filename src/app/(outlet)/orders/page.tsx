import dynamic from "next/dynamic";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCashierOutlet, getSettings } from "@/lib/settings";
import type { OrderRow } from "./orders-view";

const OrdersView = dynamic(
  () => import("./orders-view").then((m) => ({ default: m.OrdersView })),
  {
    loading: () => <div className="h-64 w-full rounded-xl bg-muted-foreground/15 animate-pulse" />,
  }
);

// ponytail: dates passed as raw UTC ISO strings; timezone formatting done client-side via formatInTz/dateStrInTz.

function toRow(o: {
  id: string;
  orderNumber: string;
  transactionDate: Date;
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  status: OrderRow["status"];
  paymentMethod: "CASH" | "CARD" | "QRIS" | null;
  cashierName: string | null;
  cashier: { name: string } | null;
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
  deletedAt: Date | null;
  deleteReason: string | null;
  items: { name: string; quantity: number; price: number; note: string | null }[];
}): OrderRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    transactionDate: o.transactionDate.toISOString(),
    channel: o.channel,
    type: o.type,
    status: o.status,
    paymentMethod: o.paymentMethod,
    cashierName: o.cashierName ?? o.cashier?.name ?? null,
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
    deletedAt: o.deletedAt ? o.deletedAt.toISOString() : null,
    deleteReason: o.deleteReason,
    items: o.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      note: it.note,
    })),
  };
}

export default async function OrdersPage() {
  const session = await requireRole("OUTLET");

  const [active, deleted, outlet, settings] = await Promise.all([
    prisma.order.findMany({
      where: { cashierId: session.user.id, deletedAt: null },
      orderBy: { transactionDate: "desc" },
      take: 100,
      include: { items: true, cashier: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { cashierId: session.user.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 100,
      include: { items: true, cashier: { select: { name: true } } },
    }),
    getCashierOutlet(session.user.id),
    getSettings(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <OrdersView
        orders={active.map(toRow)}
        deletedOrders={deleted.map(toRow)}
        store={{
          storeName: outlet.outletName,
          address: outlet.outletAddress,
          phone: outlet.outletPhone,
          receiptFooter: settings.receiptFooter,
        }}
      />
    </div>
  );
}
