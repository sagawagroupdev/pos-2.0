"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { rupiah } from "@/lib/format";

type Props = {
  hourlyData: { hour: number; total: number; count: number }[];
  dailyData: { date: string; total: number; count: number }[];
  viewMode: "hourly" | "daily";
};

const chartConfig = {
  total: { label: "Omset", color: "#C05050" },
} satisfies ChartConfig;

export function OverviewChart({ hourlyData, dailyData, viewMode }: Props) {
  const chartData = useMemo(() => {
    if (viewMode === "hourly") {
      return hourlyData.map((d) => ({
        label: String(d.hour).padStart(2, "0") + ":00",
        total: d.total,
        count: d.count,
      }));
    }
    return dailyData.map((d) => ({ label: d.date, total: d.total, count: d.count }));
  }, [hourlyData, dailyData, viewMode]);

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Belum ada data penjualan untuk periode ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="fillOmset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C05050" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C05050" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={viewMode === "hourly" ? 3 : Math.max(Math.floor(chartData.length / 6), 0)}
            tickFormatter={(v: string) => {
              if (viewMode === "hourly") return v;
              const d = new Date(v + "T00:00:00+07:00");
              return d.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });
            }}
            fontSize={11}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => rupiah(Number(value) || 0)}
                labelFormatter={(label) => {
                  const labelStr = String(label);
                  if (viewMode === "hourly") return `Jam ${labelStr}`;
                  const d = new Date(labelStr + "T00:00:00+07:00");
                  return d.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                }}
                indicator="dot"
              />
            }
          />
          <Area
            dataKey="total"
            type="monotone"
            fill="url(#fillOmset)"
            stroke="#C05050"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
