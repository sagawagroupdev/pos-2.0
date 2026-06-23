"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  total: { label: "Omset", color: "var(--primary)" },
} satisfies ChartConfig;

const compact = (n: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n);

export function RevenueChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  const chartData = data.map((d) => ({
    label: d.date.slice(5),
    total: d.total,
  }));

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={compact}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="total"
          type="monotone"
          fill="var(--color-total)"
          fillOpacity={0.2}
          stroke="var(--color-total)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
