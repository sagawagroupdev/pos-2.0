import { requireRole } from "@/lib/session";
import { getOutletPerformance, getTransactions } from "@/lib/reports";
import { LaporanView } from "./laporan-view";

export default async function LaporanPage() {
  await requireRole("ADMIN");

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const [outlets, transactions] = await Promise.all([
    getOutletPerformance(from, to),
    getTransactions(from, to),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1>Laporan</h1>
      <LaporanView
        initialOutlets={outlets}
        initialTransactions={transactions}
        defaultFrom={from.toISOString().slice(0, 10)}
        defaultTo={to.toISOString().slice(0, 10)}
      />
    </div>
  );
}
