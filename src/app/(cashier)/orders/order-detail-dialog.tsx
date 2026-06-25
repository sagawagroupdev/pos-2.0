"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HELD_STATUS_OPTIONS,
  isHeldStatus,
  type HeldStatus,
} from "@/lib/order-status";
import { rupiah } from "@/lib/format";
import type { OrderRow } from "./types";

export function OrderDetailDialog({
  order,
  pending,
  onOpenChange,
  onStatusChange,
  onConfirm,
  onCancel,
  onContinue,
  onDelete,
}: {
  order: OrderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: HeldStatus) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onContinue: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detail Pesanan {order?.orderNumber}</DialogTitle>
          <DialogDescription>
            {order && new Date(order.transactionDate).toLocaleString("id-ID")}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.name}
                    {it.note ? ` (${it.note})` : ""}
                  </span>
                  <span>{rupiah(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>-{rupiah(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Pajak</span>
                  <span>{rupiah(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{rupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar ({order.paymentMethod})</span>
                <span>{rupiah(order.paidAmount)}</span>
              </div>
              {order.changeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{rupiah(order.changeAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {order && isHeldStatus(order.status) && (
          <DialogFooter className="sm:justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" />}
                disabled={pending}
              >
                Ubah Status
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={order.status}
                  onValueChange={(v) =>
                    v && onStatusChange(order.id, v as HeldStatus)
                  }
                >
                  <DropdownMenuLabel>Status Pesanan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {HELD_STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex gap-2">
              {order.channel === "CASHIER" ? (
                <>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => onContinue(order.id)}
                  >
                    Lanjutkan
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => onDelete(order.id)}
                  >
                    Hapus
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => onCancel(order.id)}
                  >
                    Batalkan
                  </Button>
                  <Button disabled={pending} onClick={() => onConfirm(order.id)}>
                    Konfirmasi Lunas
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
