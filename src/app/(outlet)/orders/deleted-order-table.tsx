"use client";

import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
import type { OrderRow } from "./types";

const PAGE_SIZE = 50;

export function DeletedOrderTable({
  orders,
  onSelect,
}: {
  orders: OrderRow[];
  onSelect: (order: OrderRow) => void;
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
            <TableHead>Dihapus</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Alasan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Belum ada riwayat yang dihapus
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
                  {o.deletedAt
                    ? formatInTz(o.deletedAt, {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </TableCell>
                <TableCell>{o.orderNumber}</TableCell>
                <TableCell>{rupiah(o.total)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {o.deleteReason ?? "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {orders.length > PAGE_SIZE && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="px-4 py-2">
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
