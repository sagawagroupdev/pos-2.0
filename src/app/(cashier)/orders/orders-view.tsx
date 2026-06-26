"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type HeldStatus } from "@/lib/order-status";
import { updateOrderStatus, discardDraft } from "@/app/pos/actions";
import {
  confirmQrOrder,
  cancelQrOrder,
  deleteOrderHistory,
} from "./confirm-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderFilters } from "./order-filters";
import { OrderTable } from "./order-table";
import { DeletedOrderTable } from "./deleted-order-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import { DeleteReasonDialog } from "./delete-reason-dialog";
import type { OrderRow } from "./types";

export type { OrderRow } from "./types";

export function OrdersView({
  orders,
  deletedOrders,
}: {
  orders: OrderRow[];
  deletedOrders: OrderRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [toDelete, setToDelete] = useState<OrderRow | null>(null);

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

  function handleDeleteHistory(id: string, reason: string) {
    startTransition(async () => {
      const res = await deleteOrderHistory(id, reason);
      if (res.ok) {
        toast.success("Riwayat pesanan dihapus");
        setToDelete(null);
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
    <Tabs defaultValue="active" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="active">Riwayat</TabsTrigger>
        <TabsTrigger value="deleted">
          Aktivitas Terhapus
          {deletedOrders.length > 0 ? ` (${deletedOrders.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="flex flex-col gap-4">
        <OrderFilters
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
        />
        <OrderTable orders={filtered} onSelect={setSelected} />
      </TabsContent>

      <TabsContent value="deleted">
        <DeletedOrderTable orders={deletedOrders} onSelect={setSelected} />
      </TabsContent>

      <OrderDetailDialog
        order={selected}
        pending={pending}
        onOpenChange={(open) => !open && setSelected(null)}
        onStatusChange={handleStatusChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onContinue={handleContinue}
        onDelete={handleDelete}
        onDeleteHistory={setToDelete}
      />
      <DeleteReasonDialog
        order={toDelete}
        pending={pending}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleDeleteHistory}
      />
    </Tabs>
  );
}
