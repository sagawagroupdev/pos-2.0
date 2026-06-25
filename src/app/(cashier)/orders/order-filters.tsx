"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrderFilters({
  statusFilter,
  dateFilter,
  onStatusChange,
  onDateChange,
}: {
  statusFilter: string;
  dateFilter: string;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Status</span>
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v ?? "ALL")}>
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
          onChange={(e) => onDateChange(e.target.value)}
          className="w-44"
        />
      </div>
    </div>
  );
}
