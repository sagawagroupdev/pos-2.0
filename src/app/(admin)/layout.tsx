import { requireRole } from "@/lib/session";
import { DashboardShell, type NavGroup } from "@/components/dashboard/dashboard-shell";

const ADMIN_NAV: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { href: "/outlet", label: "Outlet" },
      { href: "/kemitraan", label: "Kemitraan" },
    ],
  },
  {
    title: "Analisis",
    items: [
      { href: "/laporan", label: "Laporan" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/settings", label: "Pengaturan" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <DashboardShell items={ADMIN_NAV}>
      {children}
    </DashboardShell>
  );
}
