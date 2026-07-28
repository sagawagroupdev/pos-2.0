"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { dateStrInTz, todayStrInTz } from "@/lib/format";

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

  const todayStr = todayStrInTz();
  const sevenDaysAgoStr = dateStrInTz(
    new Date(new Date(`${todayStr}T00:00:00+07:00`).getTime() - 6 * 86400000),
  );
  const monthStartStr = (() => {
    const [year, month] = todayStr.split("-");
    return `${year}-${month}-01`;
  })();
  const isDefaultToday = !fromParam && !toParam;

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
                const f = dateStrInTz(r.from);
                const t = dateStrInTz(r.to);
                setFilter(
                  f < t ? f : t,
                  f < t ? t : f,
                );
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Hari Ini */}
      <Button
        variant={
          isDefaultToday || (fromParam === todayStr && toParam === todayStr)
            ? "default"
            : "outline"
        }
        size="lg"
        onClick={() => { setFilter(todayStr, todayStr); }}
      >
        Hari Ini
      </Button>

      {/* 7 Hari Terakhir */}
      <Button
        variant={
          fromParam === sevenDaysAgoStr && toParam === todayStr
            ? "default"
            : "outline"
        }
        size="lg"
        onClick={() => {
          setFilter(sevenDaysAgoStr, todayStr);
        }}
      >
        7 Hari Terakhir
      </Button>

      {/* Bulan Ini */}
      <Button
        variant={
          fromParam === monthStartStr && toParam === todayStr
            ? "default"
            : "outline"
        }
        size="lg"
        onClick={() => {
          setFilter(monthStartStr, todayStr);
        }}
      >
        Bulan Ini
      </Button>
    </div>
  );
}
