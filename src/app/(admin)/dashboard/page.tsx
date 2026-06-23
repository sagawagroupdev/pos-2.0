import { getRevenueSummary, getDailyRevenue } from "@/lib/reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevenueChart } from "./revenue-chart";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export default async function DashboardPage() {
  const [summary, daily] = await Promise.all([
    getRevenueSummary(),
    getDailyRevenue(30),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Omset Hari Ini</CardDescription>
            <CardTitle className="text-2xl">{rupiah(summary.today)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Omset 7 Hari</CardDescription>
            <CardTitle className="text-2xl">{rupiah(summary.week)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Omset Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">{rupiah(summary.month)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Transaksi Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">{summary.totalTransactions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Omset 30 Hari Terakhir</CardTitle>
          <CardDescription>Total penjualan harian.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={daily} />
        </CardContent>
      </Card>
    </div>
  );
}
