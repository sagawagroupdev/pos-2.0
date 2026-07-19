import "server-only";
import { prisma } from "@/lib/db";

export type DailyRevenue = { date: string; total: number; count: number };

export async function getDailyRevenue(days = 30): Promise<DailyRevenue[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", transactionDate: { gte: since } },
    select: { transactionDate: true, total: true },
  });

  const map = new Map<string, { total: number; count: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { total: 0, count: 0 });
  }
  for (const o of orders) {
    const key = o.transactionDate.toISOString().slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.total += o.total;
      entry.count += 1;
    }
  }
  return [...map.entries()].map(([date, v]) => ({ date, ...v }));
}

export type RevenueSummary = {
  today: number;
  week: number;
  month: number;
  totalTransactions: number;
};

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [day, week, month] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID", transactionDate: { gte: dayStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", transactionDate: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", transactionDate: { gte: monthStart } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return {
    today: day._sum.total ?? 0,
    week: week._sum.total ?? 0,
    month: month._sum.total ?? 0,
    totalTransactions: month._count,
  };
}

export type CashierPerformance = {
  cashierId: string;
  name: string;
  revenue: number;
  transactions: number;
};

export async function getCashierPerformance(
  from: Date,
  to: Date
): Promise<CashierPerformance[]> {
  const grouped = await prisma.order.groupBy({
    by: ["cashierId"],
    where: {
      status: "PAID",
      cashierId: { not: null },
      transactionDate: { gte: from, lte: to },
    },
    _sum: { total: true },
    _count: true,
  });

  const ids = grouped.map((g) => g.cashierId!).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(users.map((u) => [u.id, u.name]));

  return grouped
    .map((g) => ({
      cashierId: g.cashierId!,
      name: nameMap.get(g.cashierId!) ?? "—",
      revenue: g._sum.total ?? 0,
      transactions: g._count,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type TransactionRow = {
  id: string;
  date: string;
  cashierName: string;
  channel: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
};

export async function getTransactions(
  from: Date,
  to: Date
): Promise<TransactionRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      transactionDate: { gte: from, lte: to },
    },
    orderBy: { transactionDate: "desc" },
    include: {
      cashier: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    date: o.transactionDate.toISOString(),
    cashierName: o.cashier?.name ?? "—",
    channel: o.channel === "QR" ? "QR Table" : "Kasir",
    paymentMethod: o.paymentMethod ?? "—",
    total: o.total,
    itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
  }));
}
