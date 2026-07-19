"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { FloppyDiskIcon, FullScreenIcon, Home01Icon, LicenseDraftFreeIcons, Notification01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashier } from "./cashier-context";
import { useDraftsUI } from "./drafts-ui-context";
import { usePrinter } from "./printer-context";
import { useQrOrderSheetUI } from "./qr-order-sheet-ui-context";
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
  const { cashierName, setCashierName } = useCashier();
  const printer = usePrinter();
  const { enabled: draftsEnabled, count: draftCount, setOpen: setDraftsOpen } =
    useDraftsUI();
  const { setOpen: setQrOrderSheetOpen } = useQrOrderSheetUI();
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
                  <HugeiconsIcon icon={Home01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                  Overview
                </Link>
              }
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Kasir</BreadcrumbPage>
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
            <HugeiconsIcon icon={FloppyDiskIcon} size={20} color="currentColor" strokeWidth={1.5} />
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
            <HugeiconsIcon icon={LicenseDraftFreeIcons} size={24} color="currentColor" strokeWidth={1.5} />
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
          onClick={() => setQrOrderSheetOpen(true)}
          aria-label="Pesanan QR masuk"
        >
          <HugeiconsIcon icon={Notification01Icon} size={24} color="currentColor" strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={printer.connected ? "Printer siap" : "Konek printer"}
          onClick={printer.connected ? undefined : () => printer.connect()}
          className="relative"
        >
          <HugeiconsIcon icon={PrinterIcon} size={24} color="currentColor" strokeWidth={1.5} />
          <span
            className={`absolute -right-1 -top-0.5 size-2.5 rounded-full ring-2 ring-background ${
              printer.connected ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
        >
          <HugeiconsIcon icon={FullScreenIcon} size={24} color="currentColor" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}
