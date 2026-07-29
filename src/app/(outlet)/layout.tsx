import { requireRole } from "@/lib/session";
import { DashboardShell, type NavGroup } from "@/components/dashboard/dashboard-shell";
import { QrOrderNotifier } from "@/components/qr-order-notifier";

const OUTLET_NAV: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/overview", label: "Overview" },
    ],
  },
  {
    title: "Transaksi",
    items: [
      { href: "/pos", label: "POS" },
      { href: "/orders", label: "Pesanan" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { href: "/menu", label: "Menu" },
      { href: "/qr-table", label: "QR Table" },
    ],
  },
  {
    title: "Analisis",
    items: [
      { href: "/laporan-outlet", label: "Laporan" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/settings", label: "Pengaturan" },
    ],
  },
];

export default async function OutletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("OUTLET");
  return (
    <DashboardShell items={OUTLET_NAV}>
      <QrOrderNotifier cashierId={session.user.id} />
      {children}
    </DashboardShell>
  );
}
