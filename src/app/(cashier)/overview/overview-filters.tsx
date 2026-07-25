"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

function fmt(d: string) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

export function OverviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";

  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: fromParam ? new Date(fromParam + "T00:00:00") : undefined,
    to: toParam ? new Date(toParam + "T00:00:00") : undefined,
  });

  const setFilter = useCallback(
    (fromVal: string, toVal: string) => {
      const params = new URLSearchParams();
      if (fromVal) params.set("from", fromVal);
      if (toVal) params.set("to", toVal);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname],
  );

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-end justify-end gap-2">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Calendar01Icon} color="currentColor" size={16} />
          {fromParam || toParam
            ? `${fmt(fromParam)} — ${fmt(toParam)}`
            : "Pilih tanggal"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4">
          <Calendar
            range={range}
            onSelectRange={(r) => {
              setRange(r);
              if (r.from && r.to) {
                const f = r.from.toISOString().slice(0, 10);
                const t = r.to.toISOString().slice(0, 10);
                setFilter(
                  f < t ? f : t,
                  f < t ? t : f,
                );
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {/* 7 Hari Terakhir */}
      <Button
        variant={(!fromParam && !toParam) || (fromParam === new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10) && toParam === todayStr) ? "default" : "outline"}
        size="lg"
        onClick={() => {
          const d = new Date();
          const end = d.toISOString().slice(0, 10);
          d.setDate(d.getDate() - 6);
          setFilter(d.toISOString().slice(0, 10), end);
        }}
      >
        7 Hari Terakhir
      </Button>

      {/* Bulan Ini */}
      <Button
        variant={
          (() => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            return fromParam === startOfMonth && toParam === todayStr ? "default" : "outline";
          })()
        }
        size="lg"
        onClick={() => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .slice(0, 10);
          setFilter(start, now.toISOString().slice(0, 10));
        }}
      >
        Bulan Ini
      </Button>
    </div>
  );
}
