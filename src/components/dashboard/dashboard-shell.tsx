"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CashierIcon,
  DashboardSquare01Icon,
  File01Icon,
  Logout01Icon,
  MenuRestaurantIcon,
  QrCodeIcon,
  Settings01Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  Store01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export type NavItem = { href: string; label: string };

const ICON_MAP: Record<string, React.ReactNode> = {
  "/dashboard": <HugeiconsIcon icon={DashboardSquare01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/overview": <HugeiconsIcon icon={DashboardSquare01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/pos": <HugeiconsIcon icon={CashierIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/orders": <HugeiconsIcon icon={File01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/kasir": <HugeiconsIcon icon={UserGroupIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/kemitraan": <HugeiconsIcon icon={Store01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/laporan": <HugeiconsIcon icon={File01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/settings": <HugeiconsIcon icon={Settings01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/menu": <HugeiconsIcon icon={MenuRestaurantIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/qr-table": <HugeiconsIcon icon={QrCodeIcon} color="currentColor" size={20} strokeWidth={1.5} />,
};

export function DashboardShell({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const currentItem = items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentItem?.label ?? "";

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-muted/50">
      <aside
        className={cn(
          "flex flex-col bg-muted/30 transition-all duration-300 shrink-0 sticky top-0 h-screen",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Brand logo */}
        <div className="flex items-center h-14 shrink-0 gap-3 px-3">
          <Image
            src="/assets/img/pos-sgw.svg"
            alt="Sagawa POS"
            width={28}
            height={28}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="font-semibold text-sm truncate">
              Sagawa POS
            </span>
          )}
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1">
          <nav className={cn("space-y-1 pt-1", collapsed ? "px-2" : "px-2")}>
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const icon = ICON_MAP[item.href];

              const link = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl text-sm transition-colors",
                    collapsed ? "justify-center size-10" : "px-3 py-2",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-white"
                  )}
                >
                  {icon ?? null}
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );

              if (collapsed && icon) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.href}>{link}</div>;
            })}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div
          className={cn(
            "p-2",
            collapsed && "flex justify-center"
          )}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive"
                  size={collapsed ? "icon" : "sm"}
                  className={collapsed ? "size-10" : "w-full"}
                  onClick={handleLogout}
                >
                  <HugeiconsIcon icon={Logout01Icon} color="currentColor" size={20} strokeWidth={1.5} />
                  {!collapsed && "Keluar"}
                </Button>
              }
            />
            {collapsed && (
              <TooltipContent side="right">Keluar</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="m-2 rounded-xl border bg-background min-h-[calc(100vh-1rem)] flex flex-col">
          {/* Page header */}
          <div className="flex items-center gap-3 px-4 h-12 border-b shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <HugeiconsIcon icon={SidebarRightIcon} color="currentColor" size={24} strokeWidth={1.5} />
              ) : (
                <HugeiconsIcon icon={SidebarLeftIcon} color="currentColor" size={24} strokeWidth={1.5} />
              )}
            </Button>
            <div className="w-px h-5 bg-border" />
            <h2 className="text-sm font-medium">{pageTitle}</h2>
          </div>
          {/* Page content */}
          <div className="p-6 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
