import "server-only";
import { prisma } from "@/lib/db";
import { dateStrInTz } from "@/lib/format";

export type DailyRevenue = { date: string; total: number; count: number };

export async function getDailyRevenue(
  days = 30,
  cashierId?: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<DailyRevenue[]> {
  const since = fromDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const until = toDate ?? new Date();
  until.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      transactionDate: { gte: since, lte: until },
      ...(cashierId ? { cashierId } : {}),
    },
    select: { transactionDate: true, total: true },
  });

  const dayCount = Math.max(
    Math.ceil((until.getTime() - since.getTime()) / 86400000),
    1,
  );
  const map = new Map<string, { total: number; count: number }>();
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    map.set(dateStrInTz(d), { total: 0, count: 0 });
  }
  for (const o of orders) {
    const key = dateStrInTz(o.transactionDate);
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
  todayTrx: number;
  yesterday: number;
  week: number;
  month: number;
  lastMonth: number;
  totalTransactions: number;
};

export async function getRevenueSummary(
  cashierId?: string
): Promise<RevenueSummary> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(dayStart);
  yesterdayStart.setDate(dayStart.getDate() - 1);
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const baseFilter = (gte: Date, lte?: Date) => ({
    status: "PAID" as const,
    deletedAt: null,
    transactionDate: { gte, ...(lte ? { lte } : {}) },
    ...(cashierId ? { cashierId } : {}),
  });

  const [day, yesterdayAgg, todayCount, week, month, lastMonth] = await Promise.all([
    prisma.order.aggregate({
      where: baseFilter(dayStart),
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: baseFilter(yesterdayStart, dayStart),
      _sum: { total: true },
    }),
    prisma.order.count({
      where: baseFilter(dayStart),
    }),
    prisma.order.aggregate({
      where: baseFilter(weekStart),
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: baseFilter(monthStart),
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: baseFilter(lastMonthStart, lastMonthEnd),
      _sum: { total: true },
    }),
  ]);

  return {
    today: day._sum.total ?? 0,
    todayTrx: todayCount,
    yesterday: yesterdayAgg._sum.total ?? 0,
    week: week._sum.total ?? 0,
    month: month._sum.total ?? 0,
    lastMonth: lastMonth._sum.total ?? 0,
    totalTransactions: month._count,
  };
}

export type CashierPerformance = {
  cashierId: string;
  name: string;
  revenue: number;
  transactions: number;
};

export type HourlyRevenue = { hour: number; total: number; count: number };

export async function getHourlyRevenue(
  cashierId?: string,
  date?: Date,
): Promise<HourlyRevenue[]> {
  const targetDateStr = dateStrInTz(date ?? new Date());
  const target = new Date(`${targetDateStr}T00:00:00+07:00`);
  const nextDay = new Date(target.getTime() + 86400000);

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      transactionDate: { gte: target, lt: nextDay },
      ...(cashierId ? { cashierId } : {}),
    },
    select: { transactionDate: true, total: true },
  });

  const map = new Map<number, { total: number; count: number }>();
  for (let i = 0; i < 24; i++) map.set(i, { total: 0, count: 0 });
  for (const o of orders) {
    const h = (o.transactionDate.getUTCHours() + 7) % 24; // ponytail: WIB (UTC+7), no DST
    const e = map.get(h)!;
    e.total += o.total;
    e.count += 1;
  }
  return [...map.entries()]
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);
}

export type OrderTypeBreakdown = {
  type: "DINE_IN" | "TAKE_AWAY";
  count: number;
  total: number;
};

export async function getOrderTypeBreakdown(
  cashierId?: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<OrderTypeBreakdown[]> {
  const start = fromDate ?? (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      transactionDate: {
        gte: start,
        ...(toDate ? { lte: toDate } : {}),
      },
      ...(cashierId ? { cashierId } : {}),
    },
    select: { type: true, total: true },
  });

  const map = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const t = o.type;
    const e = map.get(t) ?? { count: 0, total: 0 };
    e.count++;
    e.total += o.total;
    map.set(t, e);
  }
  return [...map.entries()]
    .map(([type, v]) => ({ type, ...v } as OrderTypeBreakdown))
    .sort((a, b) => b.total - a.total);
}

export type TopMenuItem = {
  name: string;
  quantity: number;
  total: number;
};

export async function getTopMenuItems(
  cashierId?: string,
  limit = 5,
  fromDate?: Date,
  toDate?: Date,
): Promise<TopMenuItem[]> {
  const start = fromDate ?? (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: "PAID",
        deletedAt: null,
        transactionDate: {
          gte: start,
          ...(toDate ? { lte: toDate } : {}),
        },
        ...(cashierId ? { cashierId } : {}),
      },
    },
    select: { name: true, quantity: true, price: true },
  });

  const map = new Map<string, { quantity: number; total: number }>();
  for (const oi of orderItems) {
    const e = map.get(oi.name) ?? { quantity: 0, total: 0 };
    e.quantity += oi.quantity;
    e.total += oi.price * oi.quantity;
    map.set(oi.name, e);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function getCashierPerformance(
  from: Date,
  to: Date
): Promise<CashierPerformance[]> {
  const grouped = await prisma.order.groupBy({
    by: ["cashierId"],
    where: {
      status: "PAID",
      deletedAt: null,
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
  orderNumber: string;
  date: string;
  customerName: string | null;
  cashierName: string;
  channel: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
};

export async function getTransactions(
  from: Date,
  to: Date,
  cashierId?: string,
  limit?: number
): Promise<TransactionRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      transactionDate: { gte: from, lte: to },
      ...(cashierId ? { cashierId } : {}),
    },
    orderBy: { transactionDate: "desc" },
    take: limit,
    include: {
      cashier: { select: { name: true } },
      items: { select: { quantity: true } },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    date: o.transactionDate.toISOString(),
    customerName: o.customerName,
    cashierName: o.cashier?.name ?? "—",
    channel: o.channel === "QR" ? "QR Table" : "Kasir",
    paymentMethod: o.paymentMethod ?? "—",
    total: o.total,
    itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
  }));
}

export type PaymentMethodBreakdown = {
  method: string;
  count: number;
  total: number;
};

export async function getPaymentMethodBreakdown(
  cashierId?: string,
  fromDate?: Date,
  toDate?: Date,
): Promise<PaymentMethodBreakdown[]> {
  const start = fromDate ?? (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      deletedAt: null,
      paymentMethod: { not: null },
      transactionDate: {
        gte: start,
        ...(toDate ? { lte: toDate } : {}),
      },
      ...(cashierId ? { cashierId } : {}),
    },
    select: { paymentMethod: true, total: true },
  });

  const map = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const m = o.paymentMethod!;
    const entry = map.get(m) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += o.total;
    map.set(m, entry);
  }

  return [...map.entries()]
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.total - a.total);
}
