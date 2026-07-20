"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { FullScreenIcon, LicenseDraftFreeIcons, Notification01Icon, PrinterIcon, ArrowLeft02Icon, ShieldUserIcon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCashier } from "./cashier-context";
import { useDraftsUI } from "./drafts-ui-context";
import { usePrinter } from "./printer-context";
import { useQrOrderSheetUI } from "./qr-order-sheet-ui-context";
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
  const { count: qrOrderCount, setOpen: setQrOrderSheetOpen } = useQrOrderSheetUI();
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
      <Link href="/overview">
        <HugeiconsIcon icon={ArrowLeft02Icon} size={18} color="currentColor" strokeWidth={1.5} />
      </Link>

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <HugeiconsIcon icon={ShieldUserIcon} size={16} color="currentColor" strokeWidth={1.5} />
          </span>
          <Input
            id="cashier-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => { if (dirty) saveCashier(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCashier();
            }}
            placeholder="Nama kasir"
            className="h-7 w-40 pl-8 pr-8 text-sm"
          />
          <button
            type="button"
            onClick={saveCashier}
            className="absolute right-0 top-0 h-full px-2 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer z-10"
            aria-label="Simpan nama kasir"
          >
            <HugeiconsIcon icon={FloppyDiskIcon} size={16} color="currentColor" strokeWidth={1.5} />
          </button>
        </div>
        {draftsEnabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDraftsOpen(true)}
            aria-label="Pesanan tertahan"
            className="relative"
          >
            <HugeiconsIcon icon={LicenseDraftFreeIcons} size={22} color="currentColor" strokeWidth={1.5} />
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
          className="relative"
        >
          <HugeiconsIcon icon={Notification01Icon} size={22} color="currentColor" strokeWidth={1.5} />
          {qrOrderCount > 0 && (
            <span className="absolute -right-1 -top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-primary-foreground">
              {qrOrderCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={printer.connected ? "Printer siap" : "Konek printer"}
          onClick={printer.connected ? undefined : () => printer.connect()}
          className="relative"
        >
          <HugeiconsIcon icon={PrinterIcon} size={22} color="currentColor" strokeWidth={1.5} />
          <span
            className={`absolute -right-1 -top-0.5 size-2 rounded-full ring-2 ring-background ${
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
          <HugeiconsIcon icon={FullScreenIcon} size={22} color="currentColor" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}