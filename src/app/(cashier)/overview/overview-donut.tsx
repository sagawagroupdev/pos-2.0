"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { rupiah } from "@/lib/format";

type Props = {
  data: { type: string; count: number; total: number }[];
};

const COLORS: Record<string, string> = {
  DINE_IN: "#C05050",
  TAKE_AWAY: "#4A90D9",
};

const LABELS: Record<string, string> = {
  DINE_IN: "Dine In",
  TAKE_AWAY: "Take Away",
};

const chartConfig = {
  DINE_IN: { label: "Dine In", color: "#C05050" },
  TAKE_AWAY: { label: "Take Away", color: "#4A90D9" },
} satisfies ChartConfig;

export function OverviewDonut({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Belum ada data transaksi bulan ini.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={chartConfig} className="h-36 w-36 shrink-0">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={55}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.type} fill={COLORS[d.type] || "#888"} />
            ))}
          </Pie>
          {/* Center label */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize={16}
            fontWeight={700}
          >
            {total}
          </text>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(_value, name) => {
                  const item = data.find((d) => d.type === name);
                  const label = LABELS[name as string] || String(name);
                  return `${label}: ${item?.count ?? 0} transaksi (${rupiah(item?.total ?? 0)})`;
                }}
              />
            }
          />
        </PieChart>
      </ChartContainer>

      <div className="space-y-2 text-sm">
        {data.map((d) => (
          <div key={d.type} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[d.type] || "#888" }}
            />
            <span>{LABELS[d.type] || d.type}</span>
            <span className="text-muted-foreground">
              {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
