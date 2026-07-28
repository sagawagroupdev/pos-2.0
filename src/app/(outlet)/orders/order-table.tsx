"use client";

import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PrinterIcon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { rupiah, formatInTz } from "@/lib/format";
import { isAwaitingPaymentStatus } from "@/lib/order-status";
import type { OrderRow } from "./types";

const PAGE_SIZE = 50;

export function OrderTable({
  orders,
  onSelect,
  onPrint,
  onDelete,
}: {
  orders: OrderRow[];
  onSelect: (order: OrderRow) => void;
  onPrint: (order: OrderRow) => void;
  onDelete: (order: OrderRow) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(orders.length / PAGE_SIZE) || 1;

  const paginated = useMemo(
    () => orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [orders, page],
  );

  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, orders.length);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>ID Transaksi</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Pembayaran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Tidak ada pesanan
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => onSelect(o)}
              >
                <TableCell>
                  {formatInTz(o.transactionDate, {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>{o.orderNumber}</TableCell>
                <TableCell>{o.channel === "QR" ? `Table ${o.tableNumber}` : "Kasir"}</TableCell>
                <TableCell>{o.customerName ?? "-"}</TableCell>
                <TableCell>{rupiah(o.total)}</TableCell>
                <TableCell>
                  {o.paymentMethod === "CASH"
                    ? "Cash"
                    : o.paymentMethod === "CARD"
                      ? "Kartu"
                      : o.paymentMethod === "QRIS"
                        ? "QRIS"
                        : "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Cetak Struk"
                      onClick={() => onPrint(o)}
                    >
                      <HugeiconsIcon icon={PrinterIcon} color="currentColor" className="size-4" />
                    </Button>
                    {!isAwaitingPaymentStatus(o.status) && !o.deletedAt && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-destructive hover:text-destructive"
                        title="Hapus"
                        onClick={() => onDelete(o)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} color="currentColor" className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {orders.length > PAGE_SIZE && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8} className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {from}-{to} dari {orders.length}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} color="currentColor" className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} color="currentColor" className="size-4" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
