"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home2, Maximize2, Notification, Save2, MenuBoard } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashier } from "./cashier-context";
import { useDraftsUI } from "./drafts-ui-context";
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
  const { cashierName, setCashierName } = useCashier();
  const { enabled: draftsEnabled, count: draftCount, setOpen: setDraftsOpen } =
    useDraftsUI();
  const [draftName, setDraftName] = useState(cashierName);
  const [prevCashierName, setPrevCashierName] = useState(cashierName);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (cashierName !== prevCashierName) {
    setPrevCashierName(cashierName);
    setDraftName(cashierName);
  }

  const dirty = draftName.trim() !== cashierName;

  function saveCashier() {
    const next = draftName.trim();
    if (!next) {
      toast.error("Nama kasir tidak boleh kosong");
      return;
    }
    setCashierName(next);
    toast.success("Nama kasir disimpan");
  }

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

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="cashier-name" className="text-muted-foreground">
            Kasir:
          </Label>
          <Input
            id="cashier-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCashier();
            }}
            placeholder="Nama kasir"
            className="h-8 w-40"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={saveCashier}
            disabled={!dirty}
            aria-label="Simpan nama kasir"
          >
            <Save2 size={20} variant="Linear" color="currentColor" />
          </Button>
        </div>
        {draftsEnabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDraftsOpen(true)}
            aria-label="Pesanan tertahan"
            className="relative"
          >
            <MenuBoard size={24} variant="Linear" color="currentColor" />
            {draftCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {draftCount}
              </span>
            )}
          </Button>
        )}
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
            <Maximize2 size={24} variant="Linear" color="currentColor" />
          ) : (
            <Maximize2 size={24} variant="Linear" color="currentColor" />
          )}
        </Button>
      </div>
    </header>
  );
}
