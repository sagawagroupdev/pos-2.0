"use client";

import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("./revenue-chart").then((m) => ({ default: m.RevenueChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-xl bg-muted-foreground/15 animate-pulse" />
    ),
  }
);

export { RevenueChart as RevenueChartSSR };
