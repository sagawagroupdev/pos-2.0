"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home2, Maximize3, Maximize4, Notification } from "iconsax-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QrOrderNotifier } from "@/components/qr-order-notifier";

export function PosHeader({
  cashierId,
}: {
  storeName: string;
  cashierId: string;
}) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <header className="flex items-center justify-between border-b px-4 py-2.5">
      <QrOrderNotifier cashierId={cashierId} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link href="/overview" className="flex items-center gap-1.5">
                  <Home2 size={16} variant="Linear" color="currentColor" />
                  Overview
                </Link>
              }
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Kasir (POS)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
          aria-label="Notifikasi pesanan"
        >
          <Notification size={24} variant="Linear" color="currentColor" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
        >
          {isFullscreen ? (
            <Maximize3 size={24} variant="Linear" color="currentColor" />
          ) : (
            <Maximize4 size={24} variant="Linear" color="currentColor" />
          )}
        </Button>
      </div>
    </header>
  );
}
