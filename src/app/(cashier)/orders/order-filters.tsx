"use client";

import { useCallback } from "react";
import { dateStrInTz, formatInTz } from "@/lib/format";
import { CalendarIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const STATUS_ITEMS = [
  { value: "ALL", label: "Semua" },
  { value: "DRAFT", label: "Draft" },
  { value: "AWAITING_PAYMENT", label: "Menunggu Pembayaran" },
  { value: "PAID", label: "Lunas" },
  { value: "CANCELLED", label: "Dibatalkan" },
] as const;

function statusLabel(value: string): string {
  return STATUS_ITEMS.find((s) => s.value === value)?.label ?? value;
}


export function OrderFilters({
  searchQuery,
  statusFilter,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}) {
  const selectedDate = dateFilter ? new Date(dateFilter) : undefined;

  const handleSelect = useCallback(
    (date: Date) => onDateChange(dateStrInTz(date)),
    [onDateChange],
  );

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Cari</span>
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            color="currentColor"
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pesanan…"
            className="w-56 pl-8"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusChange(v ?? "ALL")}
          >
            <SelectTrigger className="w-44">
              <span>{statusLabel(statusFilter)}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Tanggal</span>
          <Popover>
            <PopoverTrigger
              className={cn(
                "flex h-9 w-40 items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                !dateFilter && "text-muted-foreground",
              )}
            >
              <span>
                {dateFilter
                  ? formatInTz(dateFilter, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Pilih tanggal"}
              </span>
              <HugeiconsIcon
                icon={CalendarIcon}
                color="currentColor"
                className="size-4"
              />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-3">
              <Calendar selected={selectedDate} onSelect={handleSelect} />
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSelect(new Date())}
                >
                  Hari Ini
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onDateChange("")}
                >
                  Hapus
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
