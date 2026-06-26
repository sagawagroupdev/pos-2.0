"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { rupiah } from "@/lib/format";
import type { OrderRow } from "./types";

export function DeletedOrderTable({
  orders,
  onSelect,
}: {
  orders: OrderRow[];
  onSelect: (order: OrderRow) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dihapus</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Alasan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Belum ada riwayat yang dihapus
            </TableCell>
          </TableRow>
        ) : (
          orders.map((o) => (
            <TableRow
              key={o.id}
              className="cursor-pointer"
              onClick={() => onSelect(o)}
            >
              <TableCell>
                {o.deletedAt
                  ? new Date(o.deletedAt).toLocaleString("id-ID", {
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
    </Table>
  );
}
