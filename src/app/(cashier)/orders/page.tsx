import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { OrdersView, type OrderRow } from "./orders-view";

export default async function OrdersPage() {
  const session = await requireRole("CASHIER");

  const orders = await prisma.order.findMany({
    where: { cashierId: session.user.id },
    orderBy: { transactionDate: "desc" },
    take: 100,
    include: { items: true },
  });

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    transactionDate: o.transactionDate.toISOString(),
    channel: o.channel,
    type: o.type,
    status: o.status,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    tableNumber: o.tableNumber,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    paidAmount: o.paidAmount,
    changeAmount: o.changeAmount,
    items: o.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      note: it.note,
    })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Riwayat Pesanan</h1>
      <OrdersView orders={rows} />
    </div>
  );
}
