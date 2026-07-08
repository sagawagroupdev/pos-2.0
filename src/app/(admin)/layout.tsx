import { requireRole } from "@/lib/session";
import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell";
import { GooeyToaster } from "@/components/ui/gooey-toaster";

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
    <DashboardShell items={ADMIN_NAV}>
      {children}
      <GooeyToaster position="top-center" />
    </DashboardShell>
  );
}
