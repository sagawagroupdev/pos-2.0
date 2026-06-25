"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  type OrderStatus,
  type HeldStatus,
} from "@/lib/order-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { updateOrderStatus, discardDraft } from "@/app/pos/actions";
import { confirmQrOrder, cancelQrOrder } from "./confirm-actions";

export type OrderRow = {
  id: string;
  orderNumber: string;
  transactionDate: string;
  channel: "CASHIER" | "QR";
  type: "DINE_IN" | "TAKE_AWAY";
  status: OrderStatus;
  paymentMethod: "CASH" | "CARD" | "QRIS";
  customerName: string | null;
  tableNumber: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  items: { name: string; quantity: number; price: number; note: string | null }[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export function OrdersView({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selected, setSelected] = useState<OrderRow | null>(null);

  function handleConfirm(id: string) {
    startTransition(async () => {
      const res = await confirmQrOrder(id);
      if (res.ok) {
        toast.success("Pesanan dikonfirmasi lunas");
        setSelected(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function handleCancel(id: string) {
    if (!confirm("Batalkan pesanan ini? Stok akan dikembalikan.")) return;
    startTransition(async () => {
      const res = await cancelQrOrder(id);
      if (res.ok) {
        toast.success("Pesanan dibatalkan");
        setSelected(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function handleStatusChange(id: string, status: HeldStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(id, status);
      if (res.ok) toast.success("Status diperbarui");
      else toast.error(res.error);
    });
  }

  function handleContinue(id: string) {
    router.push(`/pos?resume=${id}`);
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus pesanan tertahan ini?")) return;
    startTransition(async () => {
      const res = await discardDraft(id);
      if (res.ok) {
        toast.success("Pesanan dihapus");
        setSelected(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (dateFilter) {
        const d = o.transactionDate.slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "ALL")}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
                <SelectItem value="PENDING_PAYMENT">Menunggu Bayar</SelectItem>
                <SelectItem value="WAITING_CONFIRMATION">
                  Menunggu Konfirmasi
                </SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Tanggal</span>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

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
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Tidak ada pesanan
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => setSelected(o)}
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detail Pesanan {selected?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {selected &&
                new Date(selected.transactionDate).toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1">
                {selected.items.map((it, i) => (
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
                  <span>{rupiah(selected.subtotal)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Diskon</span>
                    <span>-{rupiah(selected.discount)}</span>
                  </div>
                )}
                {selected.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak</span>
                    <span>{rupiah(selected.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{rupiah(selected.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({selected.paymentMethod})</span>
                  <span>{rupiah(selected.paidAmount)}</span>
                </div>
                {selected.changeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Kembali</span>
                    <span>{rupiah(selected.changeAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {selected && isHeldStatus(selected.status) && (
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
                    value={selected.status}
                    onValueChange={(v) =>
                      v && handleStatusChange(selected.id, v as HeldStatus)
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
                {selected.channel === "CASHIER" ? (
                  <>
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleContinue(selected.id)}
                    >
                      Lanjutkan
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={pending}
                      onClick={() => handleDelete(selected.id)}
                    >
                      Hapus
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      disabled={pending}
                      onClick={() => handleCancel(selected.id)}
                    >
                      Batalkan
                    </Button>
                    <Button
                      disabled={pending}
                      onClick={() => handleConfirm(selected.id)}
                    >
                      Konfirmasi Lunas
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
