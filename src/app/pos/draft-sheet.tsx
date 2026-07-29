"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Delete02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import type { DraftOrder } from "./pos-terminal";
import { rupiah } from "@/lib/format";
import { discardDraft } from "./actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const typeLabel: Record<DraftOrder["type"], string> = {
  DINE_IN: "Dine In",
  TAKE_AWAY: "Take Away",
};
const payLabel: Record<DraftOrder["paymentMethod"], string> = {
  CASH: "Tunai",
  CARD: "Kartu",
  QRIS: "QRIS",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DraftSheet({
  open,
  onOpenChange,
  drafts,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: DraftOrder[];
  onContinue: (draft: DraftOrder) => void;
}) {
  const [detail, setDetail] = useState<DraftOrder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DraftOrder | null>(null);
  const [pending, startTransition] = useTransition();

  // Keep the open detail view in sync with refreshed draft data.
  const detailDraft = detail
    ? (drafts.find((d) => d.id === detail.id) ?? null)
    : null;

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await discardDraft(id);
      if (res.ok) {
        toast.success("Pesanan dihapus");
        setConfirmDelete(null);
        if (detail?.id === id) setDetail(null);
      } else toast.error(res.error);
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle>Pesanan Tertahan</SheetTitle>
            <SheetDescription>
              Lanjutkan atau hapus pesanan tertahan.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            {drafts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada pesanan tertahan
              </p>
            ) : (
              <ul className="flex flex-col gap-2 p-3">
                {drafts.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {d.customerName || "Tanpa nama"}
                        </p>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(d.createdAt)} · {d.items.length} item
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {rupiah(d.total)}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => setDetail(d)}
                            aria-label="Detail pesanan"
                          >
                            <HugeiconsIcon icon={ViewIcon} size={16} color="currentColor" strokeWidth={1.5} />
                          </Button>
                        }
                      />
                      <TooltipContent side="bottom">Detail</TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={!!detailDraft} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {detailDraft && (
            <>
              <DialogHeader>
                <DialogTitle>Detail {detailDraft.orderNumber}</DialogTitle>
                <DialogDescription>
                  {formatTime(detailDraft.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={detailDraft.status} />
                  <span className="text-xs text-muted-foreground">
                    {detailDraft.channel === "QR" ? "QR Table" : "Kasir"}
                  </span>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                  <div className="flex flex-col gap-0.5">
                    {detailDraft.customerName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pelanggan</span>
                        <span>{detailDraft.customerName}</span>
                      </div>
                    )}
                    {detailDraft.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telepon</span>
                        <span>{detailDraft.customerPhone}</span>
                      </div>
                    )}
                    {detailDraft.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meja</span>
                        <span>{detailDraft.tableNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipe</span>
                      <span>{typeLabel[detailDraft.type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metode</span>
                      <span>{payLabel[detailDraft.paymentMethod]}</span>
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed" />

                  <div className="flex flex-col gap-1">
                    {detailDraft.items.map((it, i) => (
                      <div key={i}>
                        <div>{it.name}</div>
                        <div className="flex justify-between">
                          <span>
                            {it.quantity} x {rupiah(it.price)}
                            {it.note ? ` · ${it.note}` : ""}
                          </span>
                          <span>{rupiah(it.price * it.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="my-2 border-t border-dashed" />

                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{rupiah(detailDraft.subtotal)}</span>
                    </div>
                    {detailDraft.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>-{rupiah(detailDraft.discount)}</span>
                      </div>
                    )}
                    {detailDraft.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>{rupiah(detailDraft.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{rupiah(detailDraft.total)}</span>
                    </div>
                    {detailDraft.paidAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Bayar</span>
                        <span>{rupiah(detailDraft.paidAmount)}</span>
                      </div>
                    )}
                    {detailDraft.changeAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Kembali</span>
                        <span>{rupiah(detailDraft.changeAmount)}</span>
                      </div>
                    )}
                  </div>

                  {detailDraft.note && (
                    <>
                      <div className="my-2 border-t border-dashed" />
                      <div>
                        <span className="text-muted-foreground">Catatan: </span>
                        {detailDraft.note}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      onContinue(detailDraft);
                      setDetail(null);
                    }}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                    Lanjutkan
                  </Button>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="destructive"
                          onClick={() => setConfirmDelete(detailDraft)}
                          disabled={pending}
                          aria-label="Hapus pesanan"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" strokeWidth={1.5} />
                        </Button>
                      }
                    />
                    <TooltipContent side="bottom">Hapus Pesanan</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pesanan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.customerName || "Pesanan tanpa nama"} ·{" "}
              {confirmDelete && rupiah(confirmDelete.total)}. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" disabled={pending}>Batal</Button>} />
            <AlertDialogAction
              render={
                <Button
                  variant="destructive"
                  loading={pending}
                  onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
                >
                  Hapus
                </Button>
              }
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
