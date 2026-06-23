import { requireRole } from "@/lib/session";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kasir", label: "Kasir" },
  { href: "/kemitraan", label: "Kemitraan" },
  { href: "/laporan", label: "Laporan" },
  { href: "/settings", label: "Pengaturan" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <DashboardShell title="Admin" items={ADMIN_NAV}>
      {children}
    </DashboardShell>
  );
}
