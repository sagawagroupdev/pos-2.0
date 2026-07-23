"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { discardDraft } from "@/app/pos/actions";
import { deleteOrderHistory } from "./confirm-actions";
import { usePrinter } from "@/app/pos/printer-context";
import { buildReceipt } from "@/lib/escpos-receipt";
import { Receipt58mm, type Receipt58mmData, type Receipt58mmStore } from "@/components/receipt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderFilters } from "./order-filters";
import { OrderTable } from "./order-table";
import { DeletedOrderTable } from "./deleted-order-table";
import { OrderDetailDialog } from "./order-detail-dialog";
import { DeleteReasonDialog } from "./delete-reason-dialog";
import type { OrderRow } from "./types";

export type { OrderRow } from "./types";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toReceiptData(o: OrderRow): Receipt58mmData {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    transactionDate: o.transactionDate,
    cashierName: o.cashierName,
    customerName: o.customerName,
    tableNumber: o.tableNumber,
    type: o.type,
    paymentMethod: o.paymentMethod ?? "CASH",
    note: o.note,
    items: o.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      itemNote: it.note,
    })),
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    paidAmount: o.paidAmount,
    changeAmount: o.changeAmount,
  };
}

export function OrdersView({
  orders,
  deletedOrders,
  store,
}: {
  orders: OrderRow[];
  deletedOrders: OrderRow[];
  store: Receipt58mmStore;
}) {
  const router = useRouter();
  const printer = usePrinter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [toDelete, setToDelete] = useState<OrderRow | null>(null);
  const [printData, setPrintData] = useState<Receipt58mmData | null>(null);

  const handlePrint = useReactToPrint({ contentRef: receiptRef });

  function handleContinue(id: string) {
    router.push(`/pos?resume=${id}`);
  }

  function handleDeleteDraft(id: string) {
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

  function handleDeleteOrder(order: OrderRow) {
    if (order.status === "DRAFT") {
      if (!confirm("Hapus pesanan ini?")) return;
      handleDeleteDraft(order.id);
    } else {
      setToDelete(order);
    }
  }

  function handlePrintOrder(order: OrderRow) {
    const data = toReceiptData(order);
    setPrintData(data);
    const bytes = buildReceipt(data, store);

    if (printer.connected) {
      printer.print(bytes).catch(() => {
        requestAnimationFrame(() => handlePrint());
      });
    } else {
      requestAnimationFrame(() => handlePrint());
    }
  }

  const q = searchQuery.toLowerCase().trim();
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (dateFilter && o.transactionDate.slice(0, 10) !== dateFilter) return false;
      if (q) {
        const match =
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.tableNumber?.toLowerCase().includes(q) ||
          o.cashierName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFilter, q]);

  return (
    <Tabs defaultValue="active" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Pesanan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lihat dan kelola riwayat pesanan
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="active">Riwayat</TabsTrigger>
          <TabsTrigger value="deleted">
            Aktivitas Terhapus
            {deletedOrders.length > 0 ? " (" + deletedOrders.length + ")" : ""}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="active" className="flex flex-col gap-4">
        <OrderFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
        />
        <OrderTable
          orders={filtered}
          onSelect={setSelected}
          onPrint={handlePrintOrder}
          onDelete={handleDeleteOrder}
        />
      </TabsContent>
      <TabsContent value="deleted">
        <DeletedOrderTable orders={deletedOrders} onSelect={setSelected} />
      </TabsContent>
      <OrderDetailDialog
        order={selected}
        pending={pending}
        onOpenChange={(open) => !open && setSelected(null)}
        onContinue={handleContinue}
        onDelete={handleDeleteDraft}
        onDeleteHistory={setToDelete}
      />
      <DeleteReasonDialog
        order={toDelete}
        pending={pending}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={handleDeleteHistory}
      />
      <div className="hidden">
        {printData && (
          <Receipt58mm
            ref={receiptRef}
            data={printData}
            store={store}
          />
        )}
      </div>
    </Tabs>
  );
}
