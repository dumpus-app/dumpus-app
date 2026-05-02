"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";

import type { Props } from "./PieChart.impl";

export type { Props };

// Lazy-load the recharts-using implementation. recharts is ~200KB and is the
// dominant cost of every detail-page chunk; deferring it cuts First Load JS
// for routes that include this component, and the chart renders in its
// reserved space once the chunk arrives.
const PieChartLazy = dynamic(() => import("./PieChart.impl"), {
  ssr: false,
  loading: () => (
    <div className={clsx("relative aspect-square h-48 overflow-hidden sm:h-72")} />
  ),
});

export default function PieChart(props: Props) {
  return <PieChartLazy {...props} />;
}
