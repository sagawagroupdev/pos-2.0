"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type HeldStatus } from "@/lib/order-status";
import { updateOrderStatus, discardDraft } from "@/app/pos/actions";
import { confirmQrOrder, cancelQrOrder } from "./confirm-actions";
import { OrderFilters } from "./order-filters";
import { OrderTable } from "./order-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import type { OrderRow } from "./types";

export type { OrderRow } from "./types";

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
      <OrderFilters
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        onStatusChange={setStatusFilter}
        onDateChange={setDateFilter}
      />
      <OrderTable orders={filtered} onSelect={setSelected} />
      <OrderDetailDialog
        order={selected}
        pending={pending}
        onOpenChange={(open) => !open && setSelected(null)}
        onStatusChange={handleStatusChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onContinue={handleContinue}
        onDelete={handleDelete}
      />
    </div>
  );
}
