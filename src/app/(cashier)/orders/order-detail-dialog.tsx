"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { isAwaitingPaymentStatus, isDraftStatus } from "@/lib/order-status";
import { rupiah, formatInTz } from "@/lib/format";
import type { OrderRow } from "./types";

const TYPE_LABEL: Record<OrderRow["type"], string> = {
  DINE_IN: "Dine In",
  TAKE_AWAY: "Take Away",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}

export function OrderDetailDialog({
  order,
  pending,
  onOpenChange,
  onContinue,
  onDelete,
  onDeleteHistory,
}: {
  order: OrderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteHistory: (order: OrderRow) => void;
}) {
  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detail Pesanan</SheetTitle>
          <SheetDescription>
            {order && formatInTz(order.transactionDate)}
          </SheetDescription>
        </SheetHeader>

        {order && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <StatusBadge status={order.status} />
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <InfoRow label="Trx ID" value={order.orderNumber} />
              <InfoRow
                label="Sumber"
                value={order.channel === "QR" ? "QR Table" : "Kasir"}
              />
              <InfoRow label="Cashier" value={order.cashierName ?? "-"} />
              <InfoRow label="Customer" value={order.customerName ?? "-"} />
              {order.customerPhone && (
                <InfoRow label="No. Telp" value={order.customerPhone} />
              )}
              {order.channel === "QR" && (
                <InfoRow label="Table Number" value={order.tableNumber ?? "-"} />
              )}
              <InfoRow label="Type" value={TYPE_LABEL[order.type]} />
              <InfoRow label="Payment Method" value={order.paymentMethod ?? "-"} />
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-medium">Item</span>
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

            {order.note && (
              <div className="flex flex-col gap-1">
                <span className="font-medium">Note</span>
                <div className="min-h-15 w-full rounded-lg border border-border p-2.5 text-sm">
                  {order.note}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{rupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{rupiah(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>PB1</span>
                  <span>{rupiah(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{rupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid ({order.paymentMethod ?? "-"})</span>
                <span>{rupiah(order.paidAmount)}</span>
              </div>
              {order.changeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Change</span>
                  <span>{rupiah(order.changeAmount)}</span>
                </div>
              )}
            </div>

            {order.deletedAt && (
              <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <span className="font-medium text-destructive">
                  Riwayat Terhapus
                </span>
                <InfoRow
                  label="Dihapus"
                  value={formatInTz(order.deletedAt)}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Alasan</span>
                  <span>{order.deleteReason ?? "-"}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {order && isDraftStatus(order.status) && order.channel === "CASHIER" && (
          <div className="flex justify-end gap-2 border-t px-4 py-3">
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
          </div>
        )}

        {order &&
          !isDraftStatus(order.status) &&
          !isAwaitingPaymentStatus(order.status) &&
          !order.deletedAt && (
          <div className="flex justify-end border-t px-4 py-3">
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => onDeleteHistory(order)}
            >
              Hapus Riwayat
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
