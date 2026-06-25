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

export function OrderTable({
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
          <TableHead>Waktu</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead>Pelanggan</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Tidak ada pesanan
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
                {new Date(o.transactionDate).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>{o.orderNumber}</TableCell>
              <TableCell>{o.channel === "QR" ? "QR Table" : "Kasir"}</TableCell>
              <TableCell>{o.customerName ?? "-"}</TableCell>
              <TableCell>{rupiah(o.total)}</TableCell>
              <TableCell>
                <StatusBadge status={o.status} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
