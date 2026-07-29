"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePrinter } from "@/app/pos/printer-context";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FullScreenIcon,
  PrinterIcon,
  CashierIcon,
  DashboardSquare01Icon,
  File01Icon,
  FileChartColumnIncreasingIcon,
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
export type NavGroup = { title?: string; items: NavItem[] };

const ICON_MAP: Record<string, React.ReactNode> = {
  "/dashboard": <HugeiconsIcon icon={DashboardSquare01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/overview": <HugeiconsIcon icon={DashboardSquare01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/pos": <HugeiconsIcon icon={CashierIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/orders": <HugeiconsIcon icon={File01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/outlet": <HugeiconsIcon icon={UserGroupIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/kemitraan": <HugeiconsIcon icon={Store01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/laporan": <HugeiconsIcon icon={File01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/settings": <HugeiconsIcon icon={Settings01Icon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/menu": <HugeiconsIcon icon={MenuRestaurantIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/qr-table": <HugeiconsIcon icon={QrCodeIcon} color="currentColor" size={20} strokeWidth={1.5} />,
  "/laporan-outlet": <HugeiconsIcon icon={FileChartColumnIncreasingIcon} color="currentColor" size={20} strokeWidth={1.5} />,
};

export function DashboardShell({
  items,
  children,
}: {
  items: NavGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const printer = usePrinter();

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  const allItems = items.flatMap((group) => group.items);
  const currentItem = allItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentItem?.label ?? "";

  async function handleLogout() {
    setMobileSidebarOpen(false);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  function renderSidebar(mobile = false) {
    const isCollapsed = collapsed && !mobile;

    return (
      <>
        <div className="flex h-14 shrink-0 items-center gap-3 px-3">
          <Image
            src="/assets/img/pos-sgw.svg"
            alt="Sagawa POS"
            width={28}
            height={28}
            className="shrink-0"
          />
          <span className="truncate text-sm font-semibold">Sagawa POS</span>
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn("px-2 pt-1", isCollapsed ? "space-y-1" : "space-y-3")}>
            {isCollapsed ? (
              items.flatMap((group) => group.items).map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const icon = ICON_MAP[item.href];

                const link = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center size-10 rounded-xl text-sm transition-colors mx-auto",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-white"
                    )}
                  >
                    {icon ?? null}
                  </Link>
                );

                if (icon) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.href}>{link}</div>;
              })
            ) : (
              items.map((group, groupIdx) => (
                <div key={group.title || groupIdx} className="space-y-1">
                  {group.title && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const icon = ICON_MAP[item.href];

                      return (
                        <div key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => mobile && setMobileSidebarOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl text-sm transition-colors px-3 py-2",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-white"
                            )}
                          >
                            {icon ?? null}
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        </ScrollArea>

        <div className={cn("p-2", !mobile && collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive"
                  size={!mobile && collapsed ? "icon" : "lg"}
                  className={!mobile && collapsed ? "size-10" : "w-full"}
                  onClick={() => setLogoutOpen(true)}
                >
                  <HugeiconsIcon icon={Logout01Icon} color="currentColor" size={20} strokeWidth={1.5} />
                  {(!mobile && !collapsed) && "Keluar"}
                </Button>
              }
            />
            {!mobile && collapsed && <TooltipContent side="right">Keluar</TooltipContent>}
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/50">
      <aside
        className={cn(
          "hidden sticky top-0 h-screen shrink-0 flex-col bg-muted/30 transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {renderSidebar(false)}
      </aside>

      <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} swipeDirection="left">
        <DrawerContent className="w-72 max-w-[85vw] bg-muted/30 shadow-none backdrop-blur-0">
          {renderSidebar(true)}
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="m-2 rounded-xl border bg-background min-h-[calc(100vh-1rem)] flex flex-col">
          {/* Page header */}
          <div className="flex items-center gap-3 px-4 h-12 border-b shrink-0">
            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka sidebar"
            >
              <HugeiconsIcon icon={SidebarLeftIcon} color="currentColor" size={24} strokeWidth={1.5} />
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    className="hidden lg:inline-flex"
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
                }
              />
              <TooltipContent side="bottom">
                {collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
              </TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-border" />
            <h2 className="text-sm font-medium">{pageTitle}</h2>
            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={printer.connected ? "Printer siap" : "Konek printer"}
                      onClick={printer.connected ? undefined : () => printer.connect()}
                      className="relative"
                    >
                      <HugeiconsIcon icon={PrinterIcon} size={18} color="currentColor" strokeWidth={1.5} />
                      <span
                        className={`absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background ${
                          printer.connected ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">
                  {printer.connected ? "Printer Siap" : "Hubungkan Printer"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={toggleFullscreen}
                      aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                    >
                      <HugeiconsIcon icon={FullScreenIcon} size={18} color="currentColor" strokeWidth={1.5} />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">
                  {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Page content */}
          <div className="p-6 flex-1">{children}</div>
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun Anda? Sesi Anda akan diakhiri.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline">Batal</Button>} />
            <AlertDialogAction
              render={
                <Button variant="destructive" onClick={handleLogout}>
                  Keluar
                </Button>
              }
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

