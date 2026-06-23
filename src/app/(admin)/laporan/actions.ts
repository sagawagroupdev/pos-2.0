"use server";

import { requireRole } from "@/lib/session";
import { getCashierPerformance, getTransactions } from "@/lib/reports";

export type ReportResult = {
  cashiers: Awaited<ReturnType<typeof getCashierPerformance>>;
  transactions: Awaited<ReturnType<typeof getTransactions>>;
};

export async function loadReport(
  fromStr: string,
  toStr: string
): Promise<ReportResult> {
  await requireRole("ADMIN");
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59`);
  const [cashiers, transactions] = await Promise.all([
    getCashierPerformance(from, to),
    getTransactions(from, to),
  ]);
  return { cashiers, transactions };
}
