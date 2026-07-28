"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { rupiah } from "@/lib/format";

type Props = {
  data: { method: string; count: number; total: number }[];
};

const COLOR: Record<string, string> = {
  QRIS: "hsl(217, 91%, 60%)",
  CASH: "hsl(142, 76%, 36%)",
  CARD: "hsl(38, 92%, 50%)",
};

const LABEL: Record<string, string> = {
  QRIS: "QRIS",
  CASH: "Cash",
  CARD: "Card",
};

const chartConfig = {
  total: { label: "Total", color: "#C05050" },
} satisfies ChartConfig;

export function OverviewPaymentBar({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Belum ada transaksi bulan ini.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...sorted.map((d) => d.total), 1);

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-32 w-full">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 60, bottom: 0, left: 4 }}
          barSize={22}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" hide domain={[0, maxTotal]} />
          <YAxis
            type="category"
            dataKey="method"
            tickLine={false}
            axisLine={false}
            width={52}
            tick={(props) => {
              const { x, y, payload } = props;
              const m = payload.value as string;
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  className="fill-foreground text-xs"
                >
                  {LABEL[m] || m}
                </text>
              );
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(_value, _name, entry) => {
                  const d = entry.payload as (typeof sorted)[number];
                  return `${LABEL[d.method] || d.method}: ${d.count} transaksi (${rupiah(d.total)})`;
                }}
              />
            }
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {sorted.map((d) => (
              <Cell key={d.method} fill={COLOR[d.method] || "#888"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* legend row */}
      <div className="flex items-center gap-4 text-xs">
        {sorted.map((d) => (
          <div key={d.method} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded"
              style={{ backgroundColor: COLOR[d.method] || "#888" }}
            />
            <span>{LABEL[d.method] || d.method}</span>
            <span className="text-muted-foreground">
              {rupiah(d.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
