import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { OrdersView, type OrderRow } from "./orders-view";

function toRow(o: {
  id: string;
  orderNumber: string;
  transactionDate: Date;
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  status: OrderRow["status"];
  paymentMethod: "CASH" | "CARD" | "QRIS";
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
    deletedAt: o.deletedAt?.toISOString() ?? null,
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
  const session = await requireRole("CASHIER");

  const [active, deleted] = await Promise.all([
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
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Riwayat Pesanan</h1>
      <OrdersView
        orders={active.map(toRow)}
        deletedOrders={deleted.map(toRow)}
      />
    </div>
  );
}
