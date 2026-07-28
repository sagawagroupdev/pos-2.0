"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { OrderRow } from "./types";

export function DeleteReasonDialog({
  order,
  pending,
  onOpenChange,
  onConfirm,
}: {
  order: OrderRow | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose(open: boolean) {
    if (!open) {
      setReason("");
      setError(null);
    }
    onOpenChange(open);
  }

  function handleSubmit() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Alasan penghapusan minimal 3 karakter");
      return;
    }
    if (order) onConfirm(order.id, trimmed);
  }

  return (
    <AlertDialog open={!!order} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Riwayat {order?.orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Pesanan akan dipindahkan ke aktivitas terhapus. Berikan alasan
            penghapusan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1">
          <Textarea
            placeholder="Alasan penghapusan..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            aria-invalid={!!error}
            autoFocus
          />
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => handleClose(false)}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? "Menghapus..." : "Hapus Riwayat"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
