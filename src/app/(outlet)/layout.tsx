import { requireRole } from "@/lib/session";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";
import { QrOrderNotifier } from "@/components/qr-order-notifier";

const OUTLET_NAV: NavItem[] = [
  { href: "/overview", label: "Overview" },
  { href: "/pos", label: "POS" },
  { href: "/orders", label: "Pesanan" },
  { href: "/menu", label: "Menu" },
  { href: "/qr-table", label: "QR Table" },
  { href: "/settings", label: "Pengaturan" },
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
