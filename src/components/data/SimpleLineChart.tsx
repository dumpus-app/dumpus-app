"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";

import type { Props } from "./SimpleLineChart.impl";

export type { Props };

// See PieChart.tsx for the rationale; same recharts deferral.
const SimpleLineChartLazy = dynamic(() => import("./SimpleLineChart.impl"), {
  ssr: false,
  loading: () => <div className={clsx("h-48 overflow-hidden sm:h-72")} />,
});

export default function SimpleLineChart(props: Props) {
  return <SimpleLineChartLazy {...props} />;
}
