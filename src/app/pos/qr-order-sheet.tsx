"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Restaurant01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { rupiah } from "@/lib/format";
import { claimQrOrderByIdAction } from "./actions";
import type { QrOrderListItem } from "./actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function formatTime(date: Date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QrOrderSheet({
  open,
  onOpenChange,
  orders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: QrOrderListItem[];
}) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.tableNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const handleClaim = useCallback(
    async (order: QrOrderListItem) => {
      if (claimingId) return;
      setClaimingId(order.id);
      try {
        const result = await claimQrOrderByIdAction(order.id);
        if (result.ok) {
          onOpenChange(false);
          router.push(`/pos?checkout=${encodeURIComponent(result.checkoutLockToken)}`);
          return;
        }
        toast.error(result.error);
      } catch {
        toast.error("Gagal mengambil pesanan");
      } finally {
        setClaimingId(null);
      }
    },
    [claimingId, onOpenChange, router]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-96 flex-col">
        <SheetHeader>
          <SheetTitle>Pesanan QR Masuk</SheetTitle>
          <SheetDescription>
            Pilih pesanan untuk diproses di kasir.
          </SheetDescription>
        </SheetHeader>
        <div className="relative px-1 pt-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size="16"
            color="currentColor"
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari meja, nama, atau nomor pesanan..."
            className="w-full rounded-lg border bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <ScrollArea className="flex-1">
          {filteredOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? "Pesanan tidak ditemukan"
                : "Tidak ada pesanan QR"}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 p-3">
              {filteredOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {o.tableNumber && (
                        <span className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium">
                          <HugeiconsIcon icon={Restaurant01Icon} size={12} color="currentColor" strokeWidth={1.5} />
                          {o.tableNumber}
                        </span>
                      )}
                      <p className="truncate text-sm font-medium">
                        {o.customerName || "Tanpa nama"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(o.createdAt)} · {o.itemCount} item ·{" "}
                      {o.orderNumber}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {rupiah(o.total)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleClaim(o)}
                    disabled={claimingId === o.id}
                    aria-label={`Muat pesanan ${o.orderNumber}`}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={1.5} />
                    {claimingId === o.id ? "..." : "Muat"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
