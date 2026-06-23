import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export default async function OverviewPage() {
  const session = await requireRole("CASHIER");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [monthAgg, monthCount, todayAgg, todayCount] = await Promise.all([
    prisma.order.aggregate({
      where: {
        cashierId: session.user.id,
        status: "PAID",
        transactionDate: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        cashierId: session.user.id,
        status: "PAID",
        transactionDate: { gte: monthStart },
      },
    }),
    prisma.order.aggregate({
      where: {
        cashierId: session.user.id,
        status: "PAID",
        transactionDate: { gte: dayStart },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        cashierId: session.user.id,
        status: "PAID",
        transactionDate: { gte: dayStart },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Halo, {session.user.name}</h1>
        <p className="text-muted-foreground">Ringkasan transaksi Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Omset Hari Ini</CardDescription>
            <CardTitle className="text-2xl">
              {rupiah(todayAgg._sum.total ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Transaksi Hari Ini</CardDescription>
            <CardTitle className="text-2xl">{todayCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Omset Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">
              {rupiah(monthAgg._sum.total ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Transaksi Bulan Ini</CardDescription>
            <CardTitle className="text-2xl">{monthCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mulai Bekerja</CardTitle>
          <CardDescription>
            Buka halaman POS untuk memproses pesanan langsung, atau lihat
            pesanan masuk dari QR Table di menu Pesanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <a
            href="/pos"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Buka POS
          </a>
          <a
            href="/orders"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Lihat Pesanan
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
