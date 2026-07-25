import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import {
  getRevenueSummary,
  getDailyRevenue,
  getTransactions,
  getPaymentMethodBreakdown,
  getHourlyRevenue,
  getOrderTypeBreakdown,
  getTopMenuItems,
} from "@/lib/reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight03Icon, ArrowDownLeft01Icon } from "@hugeicons/core-free-icons";
import { rupiah } from "@/lib/format";
import { OverviewChart } from "./overview-chart";
import { OverviewDonut } from "./overview-donut";
import { OverviewPaymentBar } from "./overview-payment-bar";
import { OverviewFilters } from "./overview-filters";

export default async function OverviewPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireRole("CASHIER");
  const { from, to } = await props.searchParams;

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - 6);

  const fmtDate = (s: string) => {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };
  const hasFilter = !!from && !!to;
  const singleDay = hasFilter && from === to;
  const filterFrom = hasFilter ? new Date(from + "T00:00:00") : undefined;
  const filterTo = hasFilter ? new Date(to + "T23:59:59") : undefined;
  const chartDate = hasFilter ? filterTo : new Date();
  const chartView = singleDay ? "hourly" : "daily";

  const [
    summary,
    daily,
    hourly,
    recentTransactions,
    payMethods,
    typeBreakdown,
    topMenu,
  ] = await Promise.all([
    getRevenueSummary(session.user.id),
    getDailyRevenue(7, session.user.id, filterFrom, filterTo),
    getHourlyRevenue(session.user.id, chartDate),
    getTransactions(filterFrom ?? weekStart, filterTo ?? now, session.user.id, 10),
    getPaymentMethodBreakdown(session.user.id, filterFrom, filterTo),
    getOrderTypeBreakdown(session.user.id, filterFrom, filterTo),
    getTopMenuItems(session.user.id, 5, filterFrom, filterTo),
  ]);

  const avgTransaction =
    summary.totalTransactions > 0
      ? Math.round(summary.month / summary.totalTransactions)
      : 0;

  return (
    <div className="flex flex-col gap-6" id="printable-report">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Halo, {session.user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Global Filter â€” wrapped in Suspense because it uses useSearchParams */}
      <Suspense fallback={<div className="h-9" />}>
        <OverviewFilters />
      </Suspense>

      {/* Stat Cards â€” bento row (always constant: hari ini / bulan ini) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>Omset Hari Ini</CardDescription>
            <CardTitle className="text-2xl">
              {rupiah(summary.today)}
            </CardTitle>
            {(() => {
              const diff = summary.today - summary.yesterday;
              const pct =
                summary.yesterday > 0
                  ? Math.round((diff / summary.yesterday) * 100)
                  : summary.today > 0
                    ? 100
                    : 0;
              const up = diff >= 0;
              return (
                <Badge
                  variant="outline"
                  className={
                    "mt-1 gap-0.5 " +
                    (up
                      ? "border-green-400 text-green-700 bg-green-50"
                      : "border-red-400 text-red-700 bg-red-50")
                  }
                >
                  <HugeiconsIcon
                    icon={up ? ArrowUpRight03Icon : ArrowDownLeft01Icon}
                    color="currentColor"
                    size={12}
                  />
                  {Math.abs(pct)}%
                </Badge>
              );
            })()}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Transaksi Hari Ini</CardDescription>
            <CardTitle className="text-2xl">{summary.todayTrx ?? "â€”"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Omset Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">
              {rupiah(summary.month)}
            </CardTitle>
            {(() => {
              const diff = summary.month - summary.lastMonth;
              const pct =
                summary.lastMonth > 0
                  ? Math.round((diff / summary.lastMonth) * 100)
                  : summary.month > 0
                    ? 100
                    : 0;
              const up = diff >= 0;
              return (
                <Badge
                  variant="outline"
                  className={
                    "mt-1 gap-0.5 " +
                    (up
                      ? "border-green-400 text-green-700 bg-green-50"
                      : "border-red-400 text-red-700 bg-red-50")
                  }
                >
                  <HugeiconsIcon
                    icon={up ? ArrowUpRight03Icon : ArrowDownLeft01Icon}
                    color="currentColor"
                    size={12}
                  />
                  {Math.abs(pct)}%
                </Badge>
              );
            })()}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Transaksi Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">
              {summary.totalTransactions}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Rata-rata per Transaksi</CardDescription>
            <CardTitle className="text-2xl">
              {rupiah(avgTransaction)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Bulan ini &middot; {summary.totalTransactions} transaksi
          </CardContent>
        </Card>
      </div>

      {/* Chart â€” full width */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Penjualan</CardTitle>
          <CardDescription>
            {hasFilter
              ? `${fmtDate(from)} - ${fmtDate(to)}`
              : "7 hari terakhir"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart hourlyData={hourly} dailyData={daily} viewMode={chartView} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut: Take Away vs Dine In */}
        <Card>
          <CardHeader>
            <CardDescription>Take Away vs Dine In</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewDonut data={typeBreakdown} />
          </CardContent>
        </Card>

        {/* Top Menu Favorit */}
        <Card>
          <CardHeader>
            <CardDescription>Menu Favorit</CardDescription>
          </CardHeader>
          <CardContent>
            {topMenu.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada data untuk periode ini.
              </p>
            ) : (
              <ol className="space-y-3">
                {topMenu.map((item, i) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {item.quantity} terjual
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        {/* Payment Methods */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription>Metode Pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewPaymentBar data={payMethods} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Recent Transactions Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>10 Transaksi Terbaru</CardTitle>
            <CardDescription>
              {hasFilter
                ? `Riwayat transaksi ${fmtDate(from)} - ${fmtDate(to)}.`
                : "Riwayat transaksi 7 hari terakhir."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                Belum ada transaksi untuk periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">No</th>
                      <th className="px-4 py-3 font-medium">Tgl/Jam</th>
                      <th className="px-4 py-3 font-medium">Pelanggan</th>
                      <th className="px-4 py-3 font-medium">Metode</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Total
                      </th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((trx, i) => (
                      <tr key={trx.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(trx.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {trx.cashierName}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({trx.channel === "QR Table" ? "QR" : "Kasir"})
                          </span>
                        </td>
                        <td className="px-4 py-3">{trx.paymentMethod}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {rupiah(trx.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="success" className="text-[10px]">
                            Lunas
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
