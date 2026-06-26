"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  HELD_STATUS_OPTIONS,
  isHeldStatus,
  type HeldStatus,
} from "@/lib/order-status";
import { rupiah } from "@/lib/format";
import type { OrderRow } from "./types";

const TYPE_LABEL: Record<OrderRow["type"], string> = {
  DINE_IN: "Makan di tempat",
  TAKE_AWAY: "Bawa pulang",
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
  onStatusChange,
  onConfirm,
  onCancel,
  onContinue,
  onDelete,
  onDeleteHistory,
}: {
  order: OrderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: HeldStatus) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
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
            {order && new Date(order.transactionDate).toLocaleString("id-ID")}
          </SheetDescription>
        </SheetHeader>

        {order && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-semibold">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <InfoRow label="Trx ID" value={order.id} />
              <InfoRow
                label="Sumber"
                value={order.channel === "QR" ? "QR Table" : "Kasir"}
              />
              <InfoRow label="Kasir" value={order.cashierName ?? "-"} />
              <InfoRow label="Pelanggan" value={order.customerName ?? "-"} />
              {order.customerPhone && (
                <InfoRow label="No. Telepon" value={order.customerPhone} />
              )}
              {order.channel === "QR" && (
                <InfoRow label="No. Meja" value={order.tableNumber ?? "-"} />
              )}
              <InfoRow label="Tipe" value={TYPE_LABEL[order.type]} />
              <InfoRow label="Pembayaran" value={order.paymentMethod} />
              {order.note && <InfoRow label="Catatan" value={order.note} />}
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

            <div className="flex flex-col gap-1 border-t pt-2">
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

            {order.deletedAt && (
              <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <span className="font-medium text-destructive">
                  Riwayat Terhapus
                </span>
                <InfoRow
                  label="Dihapus"
                  value={new Date(order.deletedAt).toLocaleString("id-ID")}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Alasan</span>
                  <span>{order.deleteReason ?? "-"}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {order && isHeldStatus(order.status) && (
          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
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
          </div>
        )}

        {order && !isHeldStatus(order.status) && !order.deletedAt && (
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
