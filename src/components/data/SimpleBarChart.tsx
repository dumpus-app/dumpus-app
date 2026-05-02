"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";

import type { Props } from "./SimpleBarChart.impl";

export type { Props };

// See PieChart.tsx for the rationale; same recharts deferral.
const SimpleBarChartLazy = dynamic(() => import("./SimpleBarChart.impl"), {
  ssr: false,
  loading: () => (
    <div className={clsx("h-48 overflow-hidden sm:h-72")} />
  ),
});

export default function SimpleBarChart(props: Props) {
  return <SimpleBarChartLazy {...props} />;
}
